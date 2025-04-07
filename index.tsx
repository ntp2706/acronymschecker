"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Upload, Clock, Check, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type QuizItem = {
  abbreviation: string
  fullForm: string
}

export default function AbbreviationQuiz() {
  const [csvData, setCsvData] = useState<QuizItem[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const [currentItem, setCurrentItem] = useState<QuizItem | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [timePerWord, setTimePerWord] = useState(10)
  const [timeLeft, setTimeLeft] = useState(0)
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, total: 0 })
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n")
      const parsedData: QuizItem[] = []

      lines.forEach((line) => {
        if (line.trim()) {
          const [abbreviation, fullForm] = line.split(",").map((item) => item.trim())
          if (abbreviation && fullForm) {
            parsedData.push({ abbreviation, fullForm })
          }
        }
      })

      setCsvData(parsedData)
      setFeedback({
        message: `Uploaded ${parsedData.length} abbreviations`,
        type: "info",
      })
    }
    reader.readAsText(file)
  }

  const startQuiz = () => {
    if (csvData.length === 0) {
      setFeedback({
        message: "Please upload a CSV file before starting",
        type: "error",
      })
      return
    }

    setIsStarted(true)
    setStats({ correct: 0, incorrect: 0, total: 0 })
    showNextWord()
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const showNextWord = () => {
    if (csvData.length === 0) return

    // Get random item
    const randomIndex = Math.floor(Math.random() * csvData.length)
    const nextItem = csvData[randomIndex]
    setCurrentItem(nextItem)
    setUserAnswer("")
    setTimeLeft(timePerWord)

    // Reset and start timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleTimeout = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setStats((prev) => ({
      ...prev,
      incorrect: prev.incorrect + 1,
      total: prev.total + 1,
    }))

    setFeedback({
      message: `Time's up! The correct answer is: ${currentItem?.fullForm}`,
      type: "error",
    })

    setTimeout(showNextWord, 2000)
  }

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentItem || !isStarted) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const isCorrect = userAnswer.toLowerCase().trim() === currentItem.fullForm.toLowerCase().trim()

    setStats((prev) => ({
      ...prev,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
      total: prev.total + 1,
    }))

    setFeedback({
      message: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${currentItem.fullForm}`,
      type: isCorrect ? "success" : "error",
    })

    setTimeout(showNextWord, isCorrect ? 1000 : 2000)
  }

  const resetQuiz = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsStarted(false)
    setCurrentItem(null)
    setUserAnswer("")
    setFeedback(null)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Acronyms Checker</h1>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {!isStarted ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="mb-2 text-sm text-muted-foreground">CSV file with 2 columns: abbreviation, full form</p>
                  <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  <Button asChild>
                    <Label htmlFor="csv-upload">Select File</Label>
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-slider">Time per word: {timePerWord} seconds</Label>
                  <Slider
                    id="time-slider"
                    min={5}
                    max={30}
                    step={1}
                    value={[timePerWord]}
                    onValueChange={(value) => setTimePerWord(value[0])}
                  />
                </div>

                {feedback && (
                  <Alert variant={feedback.type === "error" ? "destructive" : "default"}>
                    <AlertDescription>{feedback.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={startQuiz} className="w-full" disabled={csvData.length === 0}>
                  Start
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Current Acronym</span>
                  <div className="flex items-center gap-2 text-amber-500">
                    <Clock className="h-5 w-5" />
                    <span>{timeLeft}s</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <h2 className="text-4xl font-bold mb-2">{currentItem?.abbreviation}</h2>
                  <p className="text-muted-foreground">Enter the full form</p>
                </div>

                <form onSubmit={checkAnswer} className="space-y-4">
                  <Input
                    ref={inputRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter your answer..."
                    autoComplete="off"
                  />
                  <Button type="submit" className="w-full">
                    Check
                  </Button>
                </form>

                {feedback && (
                  <Alert
                    variant={
                      feedback.type === "error" ? "destructive" : feedback.type === "success" ? "default" : "default"
                    }
                  >
                    <AlertDescription>{feedback.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={resetQuiz} className="w-full">
                  End Quiz
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Correct:</span>
                  </div>
                  <span className="font-bold">{stats.correct}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    <span>Incorrect:</span>
                  </div>
                  <span className="font-bold">{stats.incorrect}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span>Total:</span>
                  <span className="font-bold">{stats.total}</span>
                </div>

                {stats.total > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span>Accuracy:</span>
                    <span className="font-bold">{Math.round((stats.correct / stats.total) * 100)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

