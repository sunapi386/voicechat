// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Medical Interpreter
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Real-time medical interpreter for English/Spanish/Chinese
          conversations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* English Card */}
        <Card className="border-blue-200 hover:border-blue-400 transition-colors">
          <CardHeader className="bg-blue-50 rounded-t-lg">
            <CardTitle className="text-blue-800">Start as Clinician</CardTitle>
            <CardDescription>English Interface</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2 text-center">
            <div className="rounded-full bg-blue-100 p-6 inline-flex mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </div>
            <p className="text-slate-600">
              For healthcare providers speaking English
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Link href="/conversation?role=clinician">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Session
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Spanish Card */}
        <Card className="border-green-200 hover:border-green-400 transition-colors">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <CardTitle className="text-green-800">
              Comenzar como Paciente
            </CardTitle>
            <CardDescription>Interfaz en Español</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2 text-center">
            <div className="rounded-full bg-green-100 p-6 inline-flex mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </div>
            <p className="text-slate-600">Para pacientes que hablan español</p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Link href="/conversation?role=patient&lang=es">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Iniciar Sesión
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Chinese Card */}
        <Card className="border-red-200 hover:border-red-400 transition-colors">
          <CardHeader className="bg-red-50 rounded-t-lg">
            <CardTitle className="text-red-800">以患者身份开始</CardTitle>
            <CardDescription>中文界面</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2 text-center">
            <div className="rounded-full bg-red-100 p-6 inline-flex mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-600"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </div>
            <p className="text-slate-600">适用于说中文的患者</p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Link href="/conversation?role=patient&lang=zh">
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                开始会话
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/admin"
          className="text-slate-500 hover:text-slate-700 underline text-sm"
        >
          Admin Panel
        </Link>
      </div>
    </div>
  );
}
