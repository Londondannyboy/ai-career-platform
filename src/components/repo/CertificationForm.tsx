'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Award, Calendar, Target, ExternalLink, AlertTriangle, 
  Clock, DollarSign, BookOpen, ChevronDown, ChevronUp, CheckCircle,
  AlertCircle, Info
} from 'lucide-react';
import { 
  Certification, 
  CertificationWarning,
  POPULAR_CERTIFICATIONS, 
  validateCertification,
  checkCertificationExpiry 
} from '@/lib/repo/educationValidation';

interface CertificationFormProps {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
  maxCertifications?: number;
  onSkillsAdd?: (skills: string[]) => void; // Callback to add skills to skills list
}

export const CertificationForm: React.FC<CertificationFormProps> = ({
  certifications,
  onChange,
  maxCertifications = 20,
  onSkillsAdd
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('Cloud');
  const [warnings, setWarnings] = useState<CertificationWarning[]>([]);

  // Check for expiry warnings
  useEffect(() => {
    const expiryWarnings = checkCertificationExpiry(certifications);
    setWarnings(expiryWarnings);
  }, [certifications]);

  const addCertification = (isPlanned: boolean = false) => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      isPlanned,
      skills: [],
      priority: 'medium'
    };
    
    onChange([...certifications, newCert]);
    setExpandedIds(new Set([...expandedIds, newCert.id!]));
  };

  const updateCertification = (id: string, updates: Partial<Certification>) => {
    const updatedCerts = certifications.map(cert => 
      cert.id === id ? { ...cert, ...updates } : cert
    );
    onChange(updatedCerts);
    
    // Revalidate
    const cert = updatedCerts.find(c => c.id === id);
    if (cert) {
      const validationErrors = validateCertification(cert);
      setErrors(prev => ({
        ...prev,
        [id]: validationErrors
      }));
    }
  };

  const removeCertification = (id: string) => {
    onChange(certifications.filter(cert => cert.id !== id));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const addSkill = (certId: string, skill: string) => {
    const cert = certifications.find(c => c.id === certId);
    if (cert && skill.trim()) {
      const newSkills = [...(cert.skills || []), skill.trim()];
      updateCertification(certId, { skills: newSkills });
    }
  };

  const removeSkill = (certId: string, index: number) => {
    const cert = certifications.find(c => c.id === certId);
    if (cert && cert.skills) {
      updateCertification(certId, { 
        skills: cert.skills.filter((_, i) => i !== index) 
      });
    }
  };

  const linkSkillsToProfile = (certId: string) => {
    const cert = certifications.find(c => c.id === certId);
    if (cert && cert.skills && onSkillsAdd) {
      onSkillsAdd(cert.skills);
    }
  };

  const selectPopularCert = (cert: { name: string; issuer: string }) => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: cert.name,
      issuer: cert.issuer,
      isPlanned: true,
      skills: [],
      priority: 'medium'
    };
    
    onChange([...certifications, newCert]);
    setExpandedIds(new Set([...expandedIds, newCert.id!]));
  };

  const getWarningIcon = (severity: CertificationWarning['severity']) => {
    switch (severity) {
      case 'expired':
        return <X className="w-4 h-4 text-red-500" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getWarningMessage = (warning: CertificationWarning) => {
    if (warning.severity === 'expired') {
      return `Expired ${warning.daysUntilExpiry} days ago`;
    }
    return `Expires in ${warning.daysUntilExpiry} days`;
  };

  // Sort certifications: warnings first, then current, then planned
  const sortedCertifications = [...certifications].sort((a, b) => {
    const aWarning = warnings.find(w => w.certId === a.id);
    const bWarning = warnings.find(w => w.certId === b.id);
    
    if (aWarning && !bWarning) return -1;
    if (!aWarning && bWarning) return 1;
    if (a.isPlanned && !b.isPlanned) return 1;
    if (!a.isPlanned && b.isPlanned) return -1;
    
    return (b.issueDate || '').localeCompare(a.issueDate || '');
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="w-5 h-5" />
          Certifications ({certifications.length}/{maxCertifications})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => addCertification(false)}
            disabled={certifications.length >= maxCertifications}
            className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Certification
          </button>
          <button
            onClick={() => addCertification(true)}
            disabled={certifications.length >= maxCertifications}
            className="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Target className="w-4 h-4" /> Plan Future
          </button>
        </div>
      </div>

      {/* Expiry Warnings */}
      {warnings.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg space-y-2">
          <h4 className="font-medium mb-2">Certification Alerts</h4>
          {warnings.map(warning => (
            <div key={warning.certId} className="flex items-center gap-2 text-sm">
              {getWarningIcon(warning.severity)}
              <span>{warning.certName}</span>
              <span className="text-gray-400">- {getWarningMessage(warning)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Popular Certifications */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Popular Certifications</h4>
        <div className="flex gap-2 mb-3">
          {Object.keys(POPULAR_CERTIFICATIONS).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded text-sm ${
                selectedCategory === category 
                  ? 'bg-blue-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          {POPULAR_CERTIFICATIONS[selectedCategory as keyof typeof POPULAR_CERTIFICATIONS]?.map((cert, index) => (
            <button
              key={index}
              onClick={() => selectPopularCert(cert)}
              className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex justify-between items-center group"
            >
              <div>
                <div className="font-medium">{cert.name}</div>
                <div className="text-xs text-gray-400">{cert.issuer}</div>
              </div>
              <Plus className="w-4 h-4 text-gray-400 group-hover:text-white" />
            </button>
          ))}
        </div>
      </div>

      {/* Certifications List */}
      <div className="space-y-4">
        {sortedCertifications.map((cert) => {
          const isExpanded = expandedIds.has(cert.id!);
          const certErrors = errors[cert.id!] || [];
          const warning = warnings.find(w => w.certId === cert.id);
          
          return (
            <div
              key={cert.id}
              className={`bg-gray-800 rounded-lg border-2 ${
                warning 
                  ? warning.severity === 'expired' 
                    ? 'border-red-600' 
                    : warning.severity === 'critical'
                      ? 'border-red-500'
                      : 'border-yellow-600'
                  : cert.isPlanned 
                    ? 'border-purple-600' 
                    : 'border-gray-700'
              }`}
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {cert.isPlanned && (
                        <span className="text-xs bg-purple-600 px-2 py-1 rounded">Future Plan</span>
                      )}
                      {warning && (
                        <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                          warning.severity === 'expired' 
                            ? 'bg-red-900 text-red-200'
                            : warning.severity === 'critical'
                              ? 'bg-red-800 text-red-200'
                              : 'bg-yellow-800 text-yellow-200'
                        }`}>
                          {getWarningIcon(warning.severity)}
                          {getWarningMessage(warning)}
                        </span>
                      )}
                      {cert.priority === 'high' && cert.isPlanned && (
                        <span className="text-xs bg-orange-600 px-2 py-1 rounded">High Priority</span>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Certification Name</label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateCertification(cert.id!, { name: e.target.value })}
                          placeholder="e.g., AWS Solutions Architect"
                          className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Issuing Organization</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => updateCertification(cert.id!, { issuer: e.target.value })}
                          placeholder="e.g., Amazon Web Services"
                          className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                        />
                      </div>
                      
                      {!cert.isPlanned ? (
                        <>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Issue Date</label>
                            <input
                              type="month"
                              value={cert.issueDate || ''}
                              onChange={(e) => updateCertification(cert.id!, { issueDate: e.target.value })}
                              className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Expiry Date (if applicable)</label>
                            <input
                              type="month"
                              value={cert.expiryDate || ''}
                              onChange={(e) => updateCertification(cert.id!, { expiryDate: e.target.value })}
                              className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Target Date</label>
                            <input
                              type="month"
                              value={cert.targetDate || ''}
                              onChange={(e) => updateCertification(cert.id!, { targetDate: e.target.value })}
                              className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Priority</label>
                            <select
                              value={cert.priority || 'medium'}
                              onChange={(e) => updateCertification(cert.id!, { 
                                priority: e.target.value as Certification['priority'] 
                              })}
                              className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                            >
                              <option value="high">High Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="low">Low Priority</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    {certErrors.length > 0 && (
                      <div className="mt-2 text-red-400 text-xs">
                        {certErrors.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleExpanded(cert.id!)}
                      className="text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeCertification(cert.id!)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-700">
                  {/* Credential Info */}
                  {!cert.isPlanned && (
                    <div className="pt-4 grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Credential ID</label>
                        <input
                          type="text"
                          value={cert.credentialId || ''}
                          onChange={(e) => updateCertification(cert.id!, { credentialId: e.target.value })}
                          placeholder="Certificate number"
                          className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Verification URL</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={cert.credentialUrl || ''}
                            onChange={(e) => updateCertification(cert.id!, { credentialUrl: e.target.value })}
                            placeholder="https://..."
                            className="flex-1 bg-gray-700 px-3 py-2 rounded text-sm"
                          />
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Study Plan for Planned Certs */}
                  {cert.isPlanned && (
                    <>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Estimated Study Hours
                          </label>
                          <input
                            type="number"
                            value={cert.estimatedStudyHours || ''}
                            onChange={(e) => updateCertification(cert.id!, { 
                              estimatedStudyHours: parseInt(e.target.value) 
                            })}
                            placeholder="e.g., 120"
                            className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Estimated Cost
                          </label>
                          <input
                            type="number"
                            value={cert.cost || ''}
                            onChange={(e) => updateCertification(cert.id!, { 
                              cost: parseFloat(e.target.value) 
                            })}
                            placeholder="e.g., 300"
                            className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Study Plan
                        </label>
                        <textarea
                          value={cert.studyPlan || ''}
                          onChange={(e) => updateCertification(cert.id!, { studyPlan: e.target.value })}
                          placeholder="Outline your study approach, resources, timeline..."
                          className="w-full bg-gray-700 px-3 py-2 rounded text-sm h-20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Linked to Career Goal</label>
                        <input
                          type="text"
                          value={cert.linkedToGoal || ''}
                          onChange={(e) => updateCertification(cert.id!, { linkedToGoal: e.target.value })}
                          placeholder="e.g., Become Cloud Architect by 2025"
                          className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Skills */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-gray-400">Skills Validated</label>
                      {cert.skills && cert.skills.length > 0 && onSkillsAdd && (
                        <button
                          onClick={() => linkSkillsToProfile(cert.id!)}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Add to Skills Profile
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {cert.skills?.map((skill, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm"
                        >
                          <span>{skill}</span>
                          <button
                            onClick={() => removeSkill(cert.id!, index)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add a skill and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(cert.id!, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className="w-full bg-gray-700 px-3 py-1 rounded text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {certifications.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No certifications added yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your professional certifications or plan future ones</p>
          </div>
        )}
      </div>
    </div>
  );
};