import { Link } from "react-router-dom"
export default function ErrorPage(){
    return(
        <>
        <div className="errorContainer">
            <h1>Oops, looks like you&apos;re lost</h1>
            <Link to="/"><p>Click here to return Home</p></Link>
        </div>
        </>
    )
}