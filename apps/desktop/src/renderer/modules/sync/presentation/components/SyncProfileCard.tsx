/**
 * SyncProfileCard Component
 *
 * 同步配置卡片组件
 */

import { Cloud, Check, Trash2, Edit2, Star, Zap } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-shadcn';
import { MoreVertical } from 'lucide-react';
import type { SyncProfileClientDTO, SyncProviderType } from '@dailyuse/contracts/sync';

interface SyncProfileCardProps {
  profile: SyncProfileClientDTO;
  isActive?: boolean;
  isDefault?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  onActivate?: () => void;
}

const providerLabels: Record<SyncProviderType, string> = {
  GITHUB_GIST: 'GitHub Gist',
  WEBDAV: 'WebDAV',
  CUSTOM_SERVER: '自定义服务器',
  LOCAL_FILE: '本地文件',
};

export function SyncProfileCard({
  profile,
  isActive = false,
  isDefault = false,
  onEdit,
  onDelete,
  onSetDefault,
  onActivate,
}: SyncProfileCardProps) {
  const providerLabel = providerLabels[profile.providerType] ?? profile.providerType;

  return (
    <Card className={`relative ${isActive ? 'border-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{profile.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
              )}
              {onActivate && !isActive && (
                <DropdownMenuItem onClick={onActivate}>
                  <Zap className="h-4 w-4 mr-2" />
                  激活
                </DropdownMenuItem>
              )}
              {onSetDefault && !isDefault && (
                <DropdownMenuItem onClick={onSetDefault}>
                  <Star className="h-4 w-4 mr-2" />
                  设为默认
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex items-center gap-2">
          {providerLabel}
          {isActive && (
            <Badge variant="default" className="h-5 text-xs">
              <Check className="h-3 w-3 mr-1" />
              当前
            </Badge>
          )}
          {isDefault && (
            <Badge variant="secondary" className="h-5 text-xs">
              <Star className="h-3 w-3 mr-1" />
              默认
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground space-y-1">
          {profile.lastSyncAt && (
            <p>上次同步: {new Date(profile.lastSyncAt).toLocaleString()}</p>
          )}
          {!profile.lastSyncAt && <p className="italic">尚未同步</p>}
        </div>
      </CardContent>
    </Card>
  );
}
