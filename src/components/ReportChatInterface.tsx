import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ReportChatInterfaceProps {
  reportContext?: any;
  language?: string;
}

const ReportChatInterface: React.FC<ReportChatInterfaceProps> = ({ 
  reportContext, 
  language = 'en' 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!currentQuestion.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentQuestion,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const questionToSend = currentQuestion;
    setCurrentQuestion('');
    setIsLoading(true);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('medical-chat-assistant', {
        body: { 
          question: questionToSend,
          reportContext,
          language,
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) throw error;

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const errorMessages = {
        en: "I apologize, but I'm unable to process your question at the moment. Please try again or consult your healthcare provider for assistance.",
        hi: "मुझे खेद है, लेकिन मैं इस समय आपके प्रश्न को संसाधित करने में असमर्थ हूं। कृपया फिर से कोशिश करें या सहायता के लिए अपने स्वास्थ्य सेवा प्रदाता से परामर्श करें।",
        mr: "मला माफ करा, परंतु मी सध्या तुमच्या प्रश्नावर प्रक्रिया करू शकत नाही. कृपया पुन्हा प्रयत्न करा किंवा सहाय्यासाठी तुमच्या आरोग्य सेवा प्रदात्याशी सल्लामसलत करा."
      };

      const fallbackMessage = errorMessages[language as keyof typeof errorMessages] || errorMessages.en;

      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "Chat Error",
        description: "Unable to process your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Language-specific placeholder text
  const placeholderTexts = {
    en: "Ask about your medical report...",
    hi: "अपनी मेडिकल रिपोर्ट के बारे में पूछें...",
    mr: "तुमच्या वैद्यकीय अहवालाबद्दल विचारा..."
  };

  const sendButtonText = {
    en: "Send",
    hi: "भेजें",
    mr: "पाठवा"
  };

  const titleTexts = {
    en: "Ask Questions About Your Report",
    hi: "अपनी रिपोर्ट के बारे में प्रश्न पूछें",
    mr: "तुमच्या अहवालाबद्दल प्रश्न विचारा"
  };

  const getCurrentText = (texts: Record<string, string>) => 
    texts[language as keyof typeof texts] || texts.en;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          {getCurrentText(titleTexts)}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get personalized explanations about your medical findings
        </p>
      </CardHeader>
      <CardContent>
        {/* Chat Messages */}
        <ScrollArea className="h-64 mb-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-8 h-8 mx-auto mb-2" />
                <p>Start by asking a question about your medical report</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Badge
                    variant={message.role === 'user' ? 'default' : 'secondary'}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center p-0"
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </Badge>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Badge variant="secondary" className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center p-0">
                  <Bot className="w-4 h-4" />
                </Badge>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getCurrentText(placeholderTexts)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!currentQuestion.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{getCurrentText(sendButtonText)}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportChatInterface;