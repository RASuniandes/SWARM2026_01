import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, ExecuteProcess, OpaqueFunction, TimerAction, IncludeLaunchDescription
from launch.conditions import IfCondition, UnlessCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node, LifecycleNode
import xacro

def evaluate_xacro(context, *args, **kwargs):
    pkg_share = get_package_share_directory('SWARM_description')
    xacro_file = os.path.join(pkg_share, 'urdf', 'SWARM.xacro')
    robot_description_config = xacro.process_file(xacro_file)
    robot_urdf = robot_description_config.toxml()
    
    use_sim_time = LaunchConfiguration('use_sim_time').perform(context)
    rviz_config_file = os.path.join(pkg_share, 'config', 'display.rviz')

    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{
            'robot_description': robot_urdf,
            'use_sim_time': True if use_sim_time.lower() == 'true' else False
        }]
    )

    spawn_robot = Node(
        package='ros_gz_sim',
        executable='create',
        output='screen',
        arguments=['-name', 'SWARM', '-topic', 'robot_description', '-x', '3.0', '-y', '0.0', '-z', '0.2']
    )

    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', rviz_config_file],
        parameters=[{'use_sim_time': True if use_sim_time.lower() == 'true' else False}],
        output='screen'
    )

    return [robot_state_publisher, spawn_robot, rviz_node]

def generate_launch_description():
    sim_time_arg = DeclareLaunchArgument('use_sim_time', default_value='true')
    
    # Mode configurations: set 'run_amcl' to true if you are loading a pre-saved map
    amcl_arg = DeclareLaunchArgument('run_amcl', default_value='false', 
                                     description='Switch to AMCL localization mode using a saved map')
    map_path_arg = DeclareLaunchArgument('map', default_value=os.path.expanduser('~/my_labyrinth_map.yaml'),
                                         description='Absolute path to saved map yaml for AMCL mode')

    pkg_share = get_package_share_directory('SWARM_description')
    target_world_name = 'labyrinth.sdf' 
    local_world_path = os.path.join(pkg_share, 'worlds', target_world_name)
    gz_cmd = ['gz', 'sim', '-r', '-v', '3']

    if os.path.exists(local_world_path):
        gz_cmd.extend(['--network-role', 'none', local_world_path])
    else:
        gz_cmd.append(target_world_name)

    if 'GZ_SIM_RESOURCE_PATH' in os.environ:
        os.environ['GZ_SIM_RESOURCE_PATH'] += os.path.pathsep + pkg_share
    else:
        os.environ['GZ_SIM_RESOURCE_PATH'] = pkg_share

    gazebo_sim = ExecuteProcess(cmd=gz_cmd, output='screen')

    # Load your bridge YAML file
    bridge_config_file = os.path.join(pkg_share, 'config', 'ros_gz_bridge_gazebo.yaml')
    
    ros_gz_bridge = Node(
            package='ros_gz_bridge',
            executable='parameter_bridge',
            arguments=[
                '/scan@sensor_msgs/msg/LaserScan[gz.msgs.LaserScan',
                '/odom@nav_msgs/msg/Odometry[gz.msgs.Odometry',
                '/cmd_vel@geometry_msgs/msg/Twist]gz.msgs.Twist',
                '/clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock',
                '/tf@tf2_msgs/msg/TFMessage[gz.msgs.Pose_V',
                '/joint_states@sensor_msgs/msg/JointState[gz.msgs.Model'
            ],
            parameters=[{
                'use_sim_time': True,
                'ros_frame_id': 'lidar_1', 
            }],
            output='screen'
        )

    # 1. MAPPING NODE (Runs only if run_amcl:=false)
    slam_toolbox = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([
            os.path.join(get_package_share_directory('slam_toolbox'), 'launch', 'online_async_launch.py')
        ]),
        condition=UnlessCondition(LaunchConfiguration('run_amcl')),
        launch_arguments={
            'use_sim_time': LaunchConfiguration('use_sim_time'),
            'map_update_interval': '0.5', 
            'minimum_time_interval': '0.1',
            'update_min_d': '0.05',  # Reduced from 0.1: Update map every 5cm of movement
            'update_min_a': '0.05',  # Reduced from 0.1: Update map every 3 degrees of turning
            
            # --- DRIFT CANCELLATION PARAMETERS ---
            'max_laser_range': '30.0',     # Explicitly limit laser depth calculations
            'minimum_travel_distance': '0.02', 
            'minimum_travel_heading': '0.02',
            'scan_buffer_size': '10',
            'link_match_minimum_response_fine': '0.1', # High sensitivity to wall corrections
        }.items()
    )

    # 2. LOCALIZATION NODES (Runs only if run_amcl:=true)
    map_server_node = LifecycleNode(
        package='nav2_map_server',
        executable='map_server',
        name='map_server',
        namespace='',
        output='screen',
        condition=IfCondition(LaunchConfiguration('run_amcl')),
        parameters=[{
            'use_sim_time': True,
            'yaml_filename': LaunchConfiguration('map')
        }]
    )

    amcl_node = LifecycleNode(
        package='nav2_amcl',
        executable='amcl',
        name='amcl',
        namespace='',
        output='screen',
        condition=IfCondition(LaunchConfiguration('run_amcl')),
        parameters=[{
            'use_sim_time': True,
            'base_frame_id': 'base_link',
            'odom_frame_id': 'odom',
            'global_frame_id': 'map',
            'scan_topic': '/scan'
        }]
    )

    # 3. COMPREHENSIVE LIFECYCLE MANAGER
    # Automatically scales down to only manage map_server/amcl when AMCL mode is running
    lifecycle_manager = Node(
        package='nav2_lifecycle_manager',
        executable='lifecycle_manager',
        name='lifecycle_manager_localization',
        output='screen',
        condition=IfCondition(LaunchConfiguration('run_amcl')),
        parameters=[{
            'use_sim_time': True,
            'autostart': True,
            'node_names': ['map_server', 'amcl'] 
        }]
    )

    # 4. MAP SAVING MANAGEMENT (Runs only during mapping mode)
    map_saver_server = LifecycleNode(
        package='nav2_map_server',
        executable='map_saver_server',
        name='map_saver',
        namespace='',
        output='screen',
        condition=UnlessCondition(LaunchConfiguration('run_amcl')),
        parameters=[{
            'save_map_timeout': 5.0,
            'use_sim_time': True,
            'autostart': True
        }]
    )

    lifecycle_manager_mapper = Node(
        package='nav2_lifecycle_manager',
        executable='lifecycle_manager',
        name='lifecycle_manager_mapper',
        output='screen',
        condition=UnlessCondition(LaunchConfiguration('run_amcl')),
        parameters=[{
            'use_sim_time': True,
            'autostart': True,
            'node_names': ['map_saver'] 
        }]
    )

    save_map_action = TimerAction(
        period=5.0,
        condition=UnlessCondition(LaunchConfiguration('run_amcl')),
        actions=[
            ExecuteProcess(
                cmd=['ros2', 'service', 'call', '/map_saver/save_map', 'nav2_msgs/srv/SaveMap', 
                     '{"map_url": "my_map"}'],
                output='screen'
            )
        ]
    )

    return LaunchDescription([
        sim_time_arg,
        amcl_arg,
        map_path_arg,
        gazebo_sim,
        ros_gz_bridge,
        OpaqueFunction(function=evaluate_xacro),
        Node(package='joint_state_publisher', executable='joint_state_publisher', name='joint_state_publisher', parameters=[{'use_sim_time': True}]),
        slam_toolbox,
        map_server_node,
        amcl_node,
        lifecycle_manager,
        map_saver_server,
        lifecycle_manager_mapper,
        save_map_action
    ])