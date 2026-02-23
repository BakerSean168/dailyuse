import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@dailyuse/ui-react-shadcn';
import type { RuleClientDTO } from '@dailyuse/governance/contracts';

interface RuleCardProps {
  rule: RuleClientDTO;
  onOpen: (id: string) => void;
}

export function RuleCard({ rule, onOpen }: RuleCardProps) {
  const statusVariant =
    rule.status === 'Active' ? 'default' : rule.status === 'Draft' ? 'secondary' : 'outline';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{rule.title}</CardTitle>
            <CardDescription>{rule.code}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{rule.status}</Badge>
            <Badge variant="outline">{rule.severity}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{rule.description}</p>

        <div className="flex flex-wrap gap-2">
          {rule.tags.slice(0, 4).map((tag) => (
            <Badge key={tag.value} variant="secondary" className="text-xs">
              {tag.value}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-end">
          <Button size="sm" onClick={() => onOpen(rule.id)}>
            查看详情
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RuleCard;
