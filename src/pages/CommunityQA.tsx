import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Search, Plus, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const CommunityQA = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', category: '' });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to ask a question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('questions')
        .insert([
          {
            ...newQuestion,
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your question has been posted",
      });

      setNewQuestion({ title: '', content: '', category: '' });
      setShowAskForm(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error posting question:', error);
      toast({
        title: "Error",
        description: "Failed to post question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetAIAnswer = async (questionId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to get AI answers",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const { data, error } = await supabase.functions.invoke('ai-qa-assistant', {
        body: {
          question: question.content,
          title: question.title,
          category: question.category,
        },
      });

      if (error) throw error;

      // Insert AI-generated answer
      const { error: insertError } = await supabase
        .from('answers')
        .insert([
          {
            question_id: questionId,
            content: data.answer,
            is_ai_generated: true,
            confidence_score: data.confidence || 0.8,
            user_id: null,
          },
        ]);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "AI answer has been generated",
      });

      fetchQuestions();
    } catch (error) {
      console.error('Error getting AI answer:', error);
      toast({
        title: "Error",
        description: "Failed to get AI answer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleHome = () => {
    window.location.href = '/';
  };

  const handleNewUpload = () => {
    window.location.href = '/medicine-identifier';
  };

  return (
    <div className="min-h-screen">
      <Navigation onHome={handleHome} onNewUpload={handleNewUpload} showBackButton={true} />
      
      <div className="pt-16">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Community Q&A</h1>
            <p className="text-xl text-muted-foreground">
              Ask questions and get answers from the community and AI
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search and Ask Section */}
            <div className="lg:w-1/3">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Ask a Question
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!showAskForm ? (
                    <Button 
                      onClick={() => setShowAskForm(true)}
                      className="w-full"
                    >
                      Ask New Question
                    </Button>
                  ) : (
                    <form onSubmit={handleAskQuestion} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Question Title</Label>
                        <Input
                          id="title"
                          value={newQuestion.title}
                          onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                          placeholder="What's your question?"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={newQuestion.category}
                          onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Select category</option>
                          <option value="general">General Health</option>
                          <option value="medications">Medications</option>
                          <option value="side-effects">Side Effects</option>
                          <option value="dosage">Dosage</option>
                          <option value="interactions">Drug Interactions</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="content">Question Details</Label>
                        <Textarea
                          id="content"
                          value={newQuestion.content}
                          onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                          placeholder="Provide more details about your question..."
                          className="min-h-[100px]"
                          required
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            'Post Question'
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowAskForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Questions List */}
            <div className="lg:w-2/3">
              <div className="space-y-4">
                {filteredQuestions.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg text-gray-500">No questions found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{question.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {question.content}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {question.category && (
                              <Badge variant="secondary">{question.category}</Badge>
                            )}
                            {question.is_answered && (
                              <Badge variant="default">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Answered
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              {question.upvotes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsDown className="w-4 h-4" />
                              {question.downvotes || 0}
                            </span>
                            <span>{question.view_count || 0} views</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGetAIAnswer(question.id)}
                            disabled={loading}
                          >
                            Get AI Answer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityQA;