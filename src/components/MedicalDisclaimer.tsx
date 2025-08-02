import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, X, AlertTriangle } from 'lucide-react';

interface MedicalDisclaimerProps {
  onDismiss: () => void;
  language?: string;
}

const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ 
  onDismiss, 
  language = 'en' 
}) => {
  const disclaimerTexts = {
    en: {
      title: "Important Medical Disclaimer",
      content: "This AI-generated analysis is for educational purposes only and is not intended as medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions. In case of emergency, contact your local emergency services immediately.",
      dismiss: "I Understand"
    },
    hi: {
      title: "महत्वपूर्ण चिकित्सा अस्वीकरण",
      content: "यह AI-जेनेरेटेड विश्लेषण केवल शैक्षिक उद्देश्यों के लिए है और चिकित्सा सलाह, निदान या उपचार के रूप में नहीं है। चिकित्सा निर्णयों के लिए हमेशा योग्य स्वास्थ्य सेवा पेशेवरों से सलाह लें। आपातकाल की स्थिति में तुरंत अपनी स्थानीय आपातकालीन सेवाओं से संपर्क करें।",
      dismiss: "मैं समझता हूं"
    },
    mr: {
      title: "महत्त्वाचे वैद्यकीय अस्वीकरण",
      content: "हे AI-जेनेरेटेड विश्लेषण केवळ शैक्षणिक हेतूंसाठी आहे आणि वैद्यकीय सल्ला, निदान किंवा उपचार म्हणून नाही. वैद्यकीय निर्णयांसाठी नेहमी पात्र आरोग्य सेवा व्यावसायिकांचा सल्ला घ्या. आणीबाणीच्या परिस्थितीत ताबडतोब तुमच्या स्थानिक आणीबाणी सेवांशी संपर्क साधा.",
      dismiss: "मला समजले"
    }
  };

  const getCurrentText = () => 
    disclaimerTexts[language as keyof typeof disclaimerTexts] || disclaimerTexts.en;

  const text = getCurrentText();

  return (
    <Alert className="border-warning bg-warning/10">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {text.title}
          </h4>
          <AlertDescription className="text-sm mb-4">
            {text.content}
          </AlertDescription>
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
            >
              {text.dismiss}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-warning hover:bg-warning/20 p-1 h-auto flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
};

export default MedicalDisclaimer;