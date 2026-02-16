/**
 * AIGenerationDialog Component
 *
 * AI 内容生成对话�?
 * Story 11-6: Auxiliary Modules
 */

import { useState, useCallback } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Wand2, FileText, ListTodo, Target, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea,
  Badge,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';

type GenerationType = 'goal' | 'task' | 'schedule' | 'summary' | 'custom';

interface AIGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (type: GenerationType, prompt: string) => Promise<string>;
  onApply?: (content: string, type: GenerationType) => void;
}

const generationTypes: {
  value: GenerationType;
  label: string;
  icon: typeof Sparkles;
  description: string;
  placeholder: string;
}[] = [
  {
    value: 'goal',
    label: '目标规划',
    icon: Target,
    description: '根据描述生成 SMART 目标和里程碑',
    placeholder: '例如: 我想在三个月内提高英语口语水平，目前是初级水'..',
  },
  {
    value: 'task',
    label: '任务分解',
    icon: ListTodo,
    description: '将复杂任务分解为可执行的子任',
    placeholder: '例如: 我需要完成一个产品发布，包括开发、测试、上'..',
  },
  {
    value: 'schedule',
    label: '日程安排',
    icon: Calendar,
    description: '根据事项生成合理的时间安',
    placeholder: '例如: 明天我需要完成报告、开两个会议、健'..',
  },
  {
    value: 'summary',
    label: '内容总结',
    icon: FileText,
    description: '总结长文本的关键信息',
    placeholder: '粘贴需要总结的文本内中...',
  },
  {
    value: 'custom',
    label: '自定',
    icon: Wand2,
    description: '输入自定义提示词',
    placeholder: '输入您的提示中...',
  },
];

export function AIGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
  onApply,
}: AIGenerationDialogProps) {
  const [generationType, setGenerationType] = useState<GenerationType>('goal');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentType = generationTypes.find((t) => t.value === generationType)!;

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult('');

    try {
      const generated = await onGenerate(generationType, prompt.trim());
      setResult(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [prompt, generationType, onGenerate]);

  // Handle regenerate
  const handleRegenerate = useCallback(async () => {
    await handleGenerate();
  }, [handleGenerate]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  // Handle apply
  const handleApply = useCallback(() => {
    if (result && onApply) {
      onApply(result, generationType);
      onOpenChange(false);
    }
  }, [result, generationType, onApply, onOpenChange]);

  // Reset on close
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setPrompt('');
        setResult('');
        setError(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 内容生成
          </DialogTitle>
          <DialogDescription>
            使用 AI 帮助您快速生成目标规划、任务分解、日程安排等内容
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Generation Type Selector */}
          <div className="flex flex-wrap gap-2">
            {generationTypes.map((type) => (
              <Button
                key={type.value}
                variant={generationType === type.value ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setGenerationType(type.value)}
              >
                <type.icon className="h-4 w-4" />
                {type.label}
              </Button>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {currentType.description}
          </p>

          {/* Input & Output */}
          <Tabs defaultValue="input" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">输入</TabsTrigger>
              <TabsTrigger value="output" disabled={!result && !loading}>
                结果
                {result && <Badge variant="secondary" className="ml-1">1</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="flex-1 flex flex-col mt-4">
              <Label htmlFor="prompt" className="mb-2">
                描述您的需�?
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={currentType.placeholder}
                className="flex-1 min-h-[200px] resize-none"
              />
            </TabsContent>

            <TabsContent value="output" className="flex-1 flex flex-col mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label>生成结果</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={loading || !prompt}
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
                    重新生成
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!result}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-500" />
                        已复�?
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 border rounded-md p-4 min-h-[200px]">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : error ? (
                  <div className="text-destructive">{error}</div>
                ) : result ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                    {result}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    点击"生成"按钮开"
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          {result && onApply && (
            <Button variant="secondary" onClick={handleApply}>
              应用到当�?
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                生成�?..
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                生成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AIGenerationDialog;
