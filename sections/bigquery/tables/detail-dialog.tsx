'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useState } from 'react';

export type AuditDetailData = {
  event_time: string;
  x_request_id: string;
  user_id: number;
  username: string;
  channel_id: number;
  token_name: string;
  origin_model: string;
  actual_model: string;
  is_stream: boolean;
  status_code: number;
  duration_ms: number;
  dropped_note: string;
  original_req_headers: string;
  original_req_body: string;
  converted_req_headers: string;
  converted_req_body: string;
  converted_same_as_original: boolean;
  upstream_response: string;
  client_response: string;
  truncated_fields: string[];
};

const MAX_PREVIEW_LENGTH = 2048;

function BodyPreview({ content, label }: { content: string; label: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!content) {
    return <p className="text-sm text-muted-foreground">（空）</p>;
  }

  const needsTruncation = content.length > MAX_PREVIEW_LENGTH;
  const displayContent =
    !expanded && needsTruncation
      ? content.slice(0, MAX_PREVIEW_LENGTH) + '...'
      : content;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {(content.length / 1024).toFixed(1)} KB
        </span>
      </div>
      <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">
        {displayContent}
      </pre>
      {needsTruncation && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? '收起'
            : `展开全部 (${(content.length / 1024).toFixed(1)} KB)`}
        </Button>
      )}
    </div>
  );
}

interface DetailDialogProps {
  open: boolean;
  onClose: () => void;
  data: AuditDetailData | null;
  loading?: boolean;
}

export function DetailDialog({
  open,
  onClose,
  data,
  loading
}: DetailDialogProps) {
  const copyRequestId = () => {
    if (data?.x_request_id) {
      navigator.clipboard.writeText(data.x_request_id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            审计详情
            {data && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={copyRequestId}
              >
                <Copy className="mr-1 h-3 w-3" />
                <span className="font-mono text-xs">{data.x_request_id}</span>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="text-muted-foreground">加载中...</span>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">用户：</span>
                {data.username} (ID: {data.user_id})
              </div>
              <div>
                <span className="text-muted-foreground">渠道：</span>
                {data.channel_id}
              </div>
              <div>
                <span className="text-muted-foreground">模型：</span>
                {data.actual_model}
              </div>
              <div>
                <span className="text-muted-foreground">状态：</span>
                {data.status_code}
              </div>
              <div>
                <span className="text-muted-foreground">耗时：</span>
                {data.duration_ms}ms
              </div>
              <div>
                <span className="text-muted-foreground">流式：</span>
                {data.is_stream ? '是' : '否'}
              </div>
              <div>
                <span className="text-muted-foreground">Token：</span>
                {data.token_name}
              </div>
              <div>
                <span className="text-muted-foreground">原始模型：</span>
                {data.origin_model}
              </div>
            </div>

            {data.truncated_fields && data.truncated_fields.length > 0 && (
              <p className="text-xs text-yellow-600">
                截断字段: {data.truncated_fields.join(', ')}
              </p>
            )}

            <Tabs defaultValue="original_req">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="original_req">原始请求</TabsTrigger>
                <TabsTrigger value="converted_req">转换后请求</TabsTrigger>
                <TabsTrigger value="upstream">上游响应</TabsTrigger>
                <TabsTrigger value="client">客户端响应</TabsTrigger>
              </TabsList>
              <TabsContent value="original_req" className="space-y-3">
                <BodyPreview
                  content={data.original_req_headers}
                  label="请求头"
                />
                <BodyPreview content={data.original_req_body} label="请求体" />
              </TabsContent>
              <TabsContent value="converted_req" className="space-y-3">
                {data.converted_same_as_original ? (
                  <p className="text-sm text-muted-foreground">
                    转换后请求与原始请求相同
                  </p>
                ) : (
                  <>
                    <BodyPreview
                      content={data.converted_req_headers}
                      label="请求头"
                    />
                    <BodyPreview
                      content={data.converted_req_body}
                      label="请求体"
                    />
                  </>
                )}
              </TabsContent>
              <TabsContent value="upstream">
                <BodyPreview
                  content={data.upstream_response}
                  label="上游原始响应"
                />
              </TabsContent>
              <TabsContent value="client">
                <BodyPreview
                  content={data.client_response}
                  label="返回客户端的响应"
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
