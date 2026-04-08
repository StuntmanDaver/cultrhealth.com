'use client'

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button'
import { Check, Edit, Loader2 } from 'lucide-react';

interface RuleVersion {
  id: string;
  version_string: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  created_by: string;
  published_at?: string;
  published_by?: string;
}

export function DosingRulesClient() {
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/dosing-rules');
      const data = await res.json();
      if (data.versions) {
        setVersions(data.versions);
      }
    } catch (err) {
      console.error('Failed to fetch rules', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handlePublish = async (versionString: string) => {
    setIsPublishing(versionString);
    try {
      const res = await fetch('/api/admin/dosing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', version_string: versionString }),
      });
      if (res.ok) {
        fetchVersions();
      } else {
        alert('Failed to publish');
      }
    } catch (err) {
      alert('Error publishing');
    } finally {
      setIsPublishing(null);
    }
  };

  const handleCreateDraft = async () => {
    const newVersion = `v${new Date().getFullYear()}.${new Date().getMonth()+1}.${new Date().getDate()}-${Math.floor(Math.random()*1000)}`;
    try {
      const res = await fetch('/api/admin/dosing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'draft', 
          version_string: newVersion,
          rules_json: { note: "Draft from UI" }
        }),
      });
      if (res.ok) {
        fetchVersions();
      }
    } catch (err) {
      alert('Error creating draft');
    }
  };

  if (isLoading) return <div className="animate-pulse">Loading rules configuration...</div>;

  return (
    <div className="bg-white rounded-2xl border border-cultr-sage shadow-sm overflow-hidden">
      <div className="p-6 border-b border-cultr-sage flex justify-between items-center bg-cultr-cream/50">
        <h2 className="text-xl font-bold font-display text-cultr-forest">Version History</h2>
        <Button variant="primary" onClick={handleCreateDraft}>Create New Draft</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-stone-600">Version</th>
              <th className="px-6 py-3 font-semibold text-stone-600">Status</th>
              <th className="px-6 py-3 font-semibold text-stone-600">Created</th>
              <th className="px-6 py-3 font-semibold text-stone-600">Published</th>
              <th className="px-6 py-3 font-semibold text-stone-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {versions.map((v) => (
              <tr key={v.id} className="hover:bg-stone-50">
                <td className="px-6 py-4 font-mono font-medium text-cultr-forest">{v.version_string}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    v.status === 'published' ? 'bg-green-100 text-green-800' :
                    v.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {v.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-stone-500">
                  {new Date(v.created_at).toLocaleDateString()} <br />
                  <span className="text-xs">{v.created_by}</span>
                </td>
                <td className="px-6 py-4 text-stone-500">
                  {v.published_at ? new Date(v.published_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="px-2 py-1 h-auto text-xs gap-1">
                      <Edit className="w-3 h-3" /> Edit JSON
                    </Button>
                    {v.status === 'draft' && (
                      <Button 
                        variant="secondary" 
                        className="px-2 py-1 h-auto text-xs gap-1 border-green-500 text-green-700 hover:bg-green-50"
                        onClick={() => handlePublish(v.version_string)}
                        disabled={isPublishing === v.version_string}
                      >
                        {isPublishing === v.version_string ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} 
                        Publish
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {versions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                  No rule versions found. Create a draft to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
