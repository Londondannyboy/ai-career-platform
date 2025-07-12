'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Brain } from 'lucide-react';

interface PendingSkill {
  id: string;
  name: string;
  category: string;
  confidence?: number;
}

interface Props {
  pendingSkills: PendingSkill[];
  onConfirmSkill: (skillId: string) => void;
  onRejectSkill: (skillId: string) => void;
}

export default function SkillConfirmation({ pendingSkills, onConfirmSkill, onRejectSkill }: Props) {
  const [processingSkills, setProcessingSkills] = useState<Set<string>>(new Set());

  const handleConfirm = async (skillId: string) => {
    setProcessingSkills(prev => new Set(prev).add(skillId));
    await onConfirmSkill(skillId);
    setProcessingSkills(prev => {
      const newSet = new Set(prev);
      newSet.delete(skillId);
      return newSet;
    });
  };

  const handleReject = (skillId: string) => {
    onRejectSkill(skillId);
  };

  if (pendingSkills.length === 0) return null;

  return (
    <div className="space-y-2">
      {pendingSkills.map((skill) => (
        <Card key={skill.id} className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Brain className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      I noticed you mentioned <strong>{skill.name}</strong>
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {skill.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Would you like me to add this as a skill to your profile?
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleConfirm(skill.id)}
                  disabled={processingSkills.has(skill.id)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {processingSkills.has(skill.id) ? 'Adding...' : 'Yes, add it'}
                </Button>
                <Button
                  onClick={() => handleReject(skill.id)}
                  disabled={processingSkills.has(skill.id)}
                  variant="outline"
                  size="sm"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  No thanks
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}