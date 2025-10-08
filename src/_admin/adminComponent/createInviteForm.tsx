'use client';

import React, { useState } from 'react';
import { useCreateInviteCode } from '../adminHooks/useCreateInviteCode';
import { Input } from '@/_lending/lendingComponents/lending-common-ui/Input';
import { Button } from '@/_lending/lendingComponents/lending-common-ui/Button';

export const CreateInviteForm = () => {
  const [note, setNote] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { createCode, isLoading, error } = useCreateInviteCode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim()) {
      alert('노트를 입력해주세요');
      return;
    }

    const result = await createCode({
      node: note,
      code: customCode || undefined,
    });

    if (result) {
      setGeneratedLink(result.link);
      setNote('');
      setCustomCode('');
    }
  };

  const handleCopy = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setGeneratedLink(null);
    setCopied(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">초대 코드 생성</h2>

      {!generatedLink ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="노트 - 추후 빠른 확인 용도 (필수)"
            placeholder="예: 김엑션 - 쇼피파이 셀러"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            error={error || undefined}
          />

          <Input
            label="커스텀 코드 (선택)"
            placeholder="예: EXTION-USER-023 (비워두면 자동 생성)"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            helperText="비워두면 EXTION-early-user-XXX 형식으로 자동 생성됩니다"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            초대 코드 생성
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600 font-medium mb-2">
              초대 코드가 생성되었습니다!
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-mono"
              />
              <Button
                variant={copied ? 'secondary' : 'primary'}
                size="md"
                onClick={handleCopy}
              >
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="w-full"
          >
            새 초대 코드 생성
          </Button>
        </div>
      )}
    </div>
  );
};
