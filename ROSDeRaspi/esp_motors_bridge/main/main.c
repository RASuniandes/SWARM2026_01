#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/ledc.h"
#include "driver/uart.h"
#include "esp_log.h"

#define UART_PORT  UART_NUM_0
#define BAUD_RATE  115200

#define M1_IN1  1
#define M1_IN2  2
#define M2_IN1  6
#define M2_IN2  7
#define M3_IN1  8
#define M3_IN2  3
#define M4_IN1 11
#define M4_IN2 12

static void ledc_setup(int gpio, ledc_channel_t ch)
{
    static const ledc_timer_config_t tcfg = {
        .speed_mode      = LEDC_LOW_SPEED_MODE,
        .duty_resolution = LEDC_TIMER_8_BIT,
        .timer_num       = LEDC_TIMER_0,
        .freq_hz         = 1000,
        .clk_cfg         = LEDC_AUTO_CLK
    };
    ledc_timer_config(&tcfg);

    ledc_channel_config_t c = {
        .gpio_num   = gpio,
        .speed_mode = LEDC_LOW_SPEED_MODE,
        .channel    = ch,
        .timer_sel  = LEDC_TIMER_0,
        .duty       = 0,
        .hpoint     = 0
    };
    ledc_channel_config(&c);
}

static void motors_init(void)
{
    ledc_setup(M1_IN1, 0); ledc_setup(M1_IN2, 1);
    ledc_setup(M2_IN1, 2); ledc_setup(M2_IN2, 3);
    ledc_setup(M3_IN1, 4); ledc_setup(M3_IN2, 5);
    ledc_setup(M4_IN1, 6); ledc_setup(M4_IN2, 7);
}

static inline void drive(int in1_ch, int in2_ch, uint8_t d1, uint8_t d2)
{
    ledc_set_duty(LEDC_LOW_SPEED_MODE, in1_ch, d1);
    ledc_update_duty(LEDC_LOW_SPEED_MODE, in1_ch);
    ledc_set_duty(LEDC_LOW_SPEED_MODE, in2_ch, d2);
    ledc_update_duty(LEDC_LOW_SPEED_MODE, in2_ch);
}

static void forward(uint8_t v)
{
    drive(0,1,v,0); drive(2,3,v,0); drive(4,5,v,0); drive(6,7,v,0);
}

static void stop_all(void)
{
    drive(0,1,0,0); drive(2,3,0,0); drive(4,5,0,0); drive(6,7,0,0);
}

static void uart_init(void)
{
    const uart_config_t cfg = {
        .baud_rate = BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity    = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE
    };
    uart_driver_install(UART_PORT, 256, 0, 0, NULL, 0);
    uart_param_config(UART_PORT, &cfg);
    uart_set_pin(UART_PORT, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE,
                 UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);
}

void app_main(void)
{
    motors_init();
    uart_init();

    uint8_t ch;
    while (1)
    {
        int n = uart_read_bytes(UART_PORT, &ch, 1, pdMS_TO_TICKS(10));
        if (n > 0)
        {
            if (ch == 'F') forward(200);
            else stop_all();
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}
