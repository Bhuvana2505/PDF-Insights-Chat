"use client";

import { useState, useRef, useEffect, FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as pdfjs from "pdfjs-dist";
import { generateAnswer } from "@/ai/flows/generate-answer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Loader2, Send, FileText, User, LogOut, Settings } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { PdfUploader } from "@/components/pdf-uploader";
import { ChatMessage } from "@/components/chat-message";

type ChatMessageType = {
  role: "user" | "assistant";
  content: ReactNode;
};

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function ChatPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pdfTexts, setPdfTexts] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [docsProcessed, setDocsProcessed] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const [userInput, setUserInput] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.parentElement?.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory]);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(" ");
      fullText += pageText + "\n\n";
    }
    return `[Content of file: ${file.name}]\n${fullText}`;
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setDocsProcessed(false);
    setChatHistory([]);
    setPdfTexts([]);

    try {
        const extractedTexts = await Promise.all(files.map(extractTextFromPdf));
        setPdfTexts(extractedTexts);
        setDocsProcessed(true);
        setChatHistory([{ role: 'assistant', content: `I've processed your document${files.length > 1 ? 's' : ''}. What would you like to know?` }]);
        toast({
          title: "Processing Complete",
          description: `Your document${files.length > 1 ? 's' : ''} are ready. You can now ask questions.`,
        });
    } catch(error) {
        console.error("Error processing PDFs:", error);
        toast({
            title: "Error processing PDFs",
            description: "There was an issue reading the PDF files. Please ensure they are valid PDFs and try again.",
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleQuestionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const currentQuestion = userInput;
    const newChatHistory: ChatMessageType[] = [...chatHistory, { role: "user", content: currentQuestion }];
    setChatHistory(newChatHistory);
    setUserInput("");
    setIsAnswering(true);

    try {
      const response = await generateAnswer({
        question: currentQuestion,
        pdfTexts: pdfTexts,
      });

      setChatHistory(prev => [...prev, { role: "assistant", content: response.answer }]);
    } catch (error) {
      console.error(error);
      setChatHistory(chatHistory);
      setUserInput(currentQuestion);
      toast({
        title: "Error",
        description: "Failed to get an answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar side="left" collapsible="icon" variant="sidebar" className="border-r border-border/50">
          <SidebarHeader className="p-4">
            <h2 className="font-headline text-xl font-semibold">Your documents</h2>
          </SidebarHeader>
          <SidebarContent className="p-4 pt-0">
            <p className="text-sm font-medium text-muted-foreground mb-4">Upload your PDFs here and click on 'Process'</p>
            <PdfUploader 
              onFilesChange={(newFiles) => {
                setFiles(newFiles);
                setDocsProcessed(false);
                setChatHistory([]);
                setPdfTexts([]);
              }} 
              disabled={isProcessing} 
            />
          </SidebarContent>
          <SidebarFooter className="p-4">
            <Button onClick={handleProcess} disabled={isProcessing || files.length === 0} className="w-full">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isProcessing ? "Processing..." : "Process"}
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex flex-col h-screen">
            <header className="flex items-center justify-between border-b p-4 bg-card/50">
              <div className="flex items-center gap-3">
                <h1 className="font-headline text-2xl font-bold">Chat with multiple PDFs</h1>
                <span className="flex -space-x-2" aria-hidden="true">
                    <span className="h-5 w-5 rounded-sm bg-chart-1/80"></span>
                    <span className="h-5 w-5 rounded-sm bg-chart-2/80"></span>
                    <span className="h-5 w-5 rounded-sm bg-chart-3/80"></span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="bg-card">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">PDF User</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          user@example.com
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/')}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            
            <main className="flex-1 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="p-4 md:p-6">
                        {chatHistory.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] text-center">
                                <div className="p-5 bg-card rounded-full mb-4 border">
                                    <FileText size={40} className="text-primary"/>
                                </div>
                                <h2 className="text-2xl font-headline font-semibold">Ready for your documents</h2>
                                <p className="text-muted-foreground mt-2 max-w-md">
                                    Upload your PDF documents in the sidebar, click "Process," and then ask me anything about their content.
                                </p>
                             </div>
                        ) : (
                          <>
                            {chatHistory.map((msg, index) => <ChatMessage key={index} {...msg} />)}
                            {isAnswering && <ChatMessage role="assistant" content={<Loader2 className="h-5 w-5 animate-spin text-primary" />} />}
                          </>
                        )}
                    </div>
                </ScrollArea>
            </main>

            <footer className="border-t p-4 bg-card/50">
              <form onSubmit={handleQuestionSubmit} className="relative">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={docsProcessed ? "Ask a question about your documents..." : "Please process your documents first"}
                  className="pr-16 resize-none min-h-[52px]"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleQuestionSubmit(e);
                    }
                  }}
                  disabled={!docsProcessed || isAnswering || isProcessing}
                  aria-label="Ask a question about your documents"
                />
                <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9" disabled={!docsProcessed || isAnswering || !userInput.trim()}>
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send question</span>
                </Button>
              </form>
            </footer>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
