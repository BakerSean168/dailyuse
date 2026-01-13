/**
 * Editor View - Main exports
 */
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@dailyuse/ui-shadcn';

/**
 * Editor View Component
 * TODO: Implement full editor functionality
 */
export function EditorView() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>📝 编辑器</CardTitle>
          <CardDescription>文档编辑和管理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              编辑器模块正在开发中...
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl mb-2">📄</div>
                  <h3 className="font-semibold">文档管理</h3>
                  <p className="text-sm text-muted-foreground">创建和编辑文档</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl mb-2">📋</div>
                  <h3 className="font-semibold">模板</h3>
                  <p className="text-sm text-muted-foreground">使用文档模板</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl mb-2">💾</div>
                  <h3 className="font-semibold">自动保存</h3>
                  <p className="text-sm text-muted-foreground">草稿自动保存</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Default export for lazy loading
export default EditorView;
