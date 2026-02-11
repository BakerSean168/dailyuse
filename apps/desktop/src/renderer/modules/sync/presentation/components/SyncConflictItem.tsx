/**
 * SyncConflictItem Component
 *
 * 同步冲突项组�?
 */

import { AlertTriangle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@dailyuse/ui-react-shadcn';
import type { SyncConflictClientDTO } from '@dailyuse/contracts/sync';

interface SyncConflictItemProps {
  conflict: SyncConflictClientDTO;
  onResolveLocal: () => void;
  onResolveRemote: () => void;
}

export function SyncConflictItem({
  conflict,
  onResolveLocal,
  onResolveRemote,
}: SyncConflictItemProps) {
  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-base">{conflict.entityRef.entityType}</CardTitle>
          </div>
          <Badge variant="outline" className="text-orange-600">
            {conflict.conflictType}
          </Badge>
        </div>
        <CardDescription>
          {conflict.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              本地版本
            </div>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(conflict.localData, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground">
              版本: {conflict.localVersion.logicalVersion}
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-1">
              <ArrowRight className="h-4 w-4" />
              远程版本
            </div>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(conflict.remoteData, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground">
              版本: {conflict.remoteVersion.logicalVersion}
            </p>
          </div>
        </div>
        {conflict.conflictedFields.length > 0 && (
          <div className="text-xs text-muted-foreground">
            冲突字段: {conflict.conflictedFields.join(', ')}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onResolveLocal}>
            <Check className="h-4 w-4 mr-1" />
            使用本地
          </Button>
          <Button variant="default" size="sm" onClick={onResolveRemote}>
            <Check className="h-4 w-4 mr-1" />
            使用远程
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
