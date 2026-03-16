import { Linkedin, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Bubbles() {
  return <>
    <Link
      to="https://www.linkedin.com/company/rasuniandes/posts/?feedView=all"
      className="fixed bottom-4 right-4 w-10 h-10 overflow-hidden rounded-full border-white z-100">
      <Linkedin className="w-10 h-10 bg-blue-400 p-2 text-white" />
    </Link>
    <Link
      to="mailto:ras@uniandes.edu.co"
      target="_blank"
      className="fixed bottom-16 right-4 w-10 h-10 overflow-hidden rounded-full border-white z-100">
      <Mail className="w-10 h-10 bg-blue-500 p-2 text-white" />
    </Link>
  </>
}