'use client';
import { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Save, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { GroupConfigItem } from '@/lib/types/model-plaza';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: '系统设置', link: '/dashboard/setting' },
  { title: '折扣设置', link: '/dashboard/setting/discount' }
];

interface GroupFormData {
  group_key: string;
  display_name: string;
  discount: number;
  sort_order: number;
  description: string;
}

const defaultFormData: GroupFormData = {
  group_key: '',
  display_name: '',
  discount: 100,
  sort_order: 0,
  description: ''
};

export default function DiscountPage() {
  // ==================== 用户分组折扣状态 ====================
  const [groups, setGroups] = useState<GroupConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ==================== Dialog 状态 ====================
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupConfigItem | null>(
    null
  );
  const [formData, setFormData] = useState<GroupFormData>(defaultFormData);

  // ==================== 删除确认状态 ====================
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<GroupConfigItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // ==================== 数据获取 ====================
  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/group-config');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        const sortedGroups = [...(result.data as GroupConfigItem[])].sort(
          (a, b) => a.sort_order - b.sort_order
        );
        setGroups(sortedGroups);
      }
    } catch (err) {
      toast.error('获取分组列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ==================== 新增/编辑操作 ====================
  const openCreateDialog = () => {
    setEditingGroup(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (group: GroupConfigItem) => {
    setEditingGroup(group);
    setFormData({
      group_key: group.group_key,
      display_name: group.display_name,
      discount: group.discount,
      sort_order: group.sort_order,
      description: group.description
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.group_key.trim()) {
      toast.error('请输入分组标识');
      return;
    }
    if (!formData.display_name.trim()) {
      toast.error('请输入显示名称');
      return;
    }
    if (formData.discount < 0 || formData.discount > 100) {
      toast.error('折扣率必须在 0-100 之间');
      return;
    }

    try {
      setIsSaving(true);
      const isEdit = editingGroup !== null;
      const body = isEdit ? { ...formData, id: editingGroup.id } : formData;

      const response = await fetch('/api/group-config', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        toast.success(isEdit ? '更新分组成功' : '创建分组成功');
        setDialogOpen(false);
        fetchGroups();
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== 删除操作 ====================
  const openDeleteDialog = (group: GroupConfigItem) => {
    setDeletingGroup(group);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/group-config/${deletingGroup.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        toast.success('删除分组成功');
        setDeleteDialogOpen(false);
        setDeletingGroup(null);
        fetchGroups();
      } else {
        toast.error(result.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // ==================== 渲染 ====================
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">折扣设置</h2>
        </div>
        <Separator />

        <Tabs defaultValue="group-discount" className="space-y-4">
          <TabsList>
            <TabsTrigger value="group-discount">用户分组折扣</TabsTrigger>
          </TabsList>

          {/* ==================== 用户分组折扣 Tab ==================== */}
          <TabsContent value="group-discount" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  管理用户分组及其对应的折扣率。折扣率为百分比，100
                  表示无折扣，50 表示五折。
                </p>
              </div>
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新增分组
              </Button>
            </div>

            {/* 分组列表表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">分组标识</TableHead>
                    <TableHead className="w-[120px]">显示名称</TableHead>
                    <TableHead className="w-[100px]">折扣率</TableHead>
                    <TableHead className="w-[80px]">排序</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="w-[100px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : groups.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        暂无分组配置，点击"新增分组"添加
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-mono text-sm">
                          {group.group_key}
                        </TableCell>
                        <TableCell>{group.display_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              group.discount < 100 ? 'default' : 'secondary'
                            }
                          >
                            {group.discount}%
                          </Badge>
                        </TableCell>
                        <TableCell>{group.sort_order}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                          {group.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(group)}
                              title="编辑"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => openDeleteDialog(group)}
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ==================== 新增/编辑 Dialog ==================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingGroup ? '编辑分组' : '新增分组'}</DialogTitle>
            <DialogDescription>
              {editingGroup
                ? '修改用户分组的折扣配置'
                : '创建一个新的用户分组折扣配置'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group_key">
                分组标识 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="group_key"
                placeholder="例如: vip, premium, default"
                value={formData.group_key}
                onChange={(e) =>
                  setFormData({ ...formData, group_key: e.target.value })
                }
                disabled={editingGroup !== null}
              />
              <p className="text-xs text-muted-foreground">
                唯一标识，创建后不可修改
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">
                显示名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display_name"
                placeholder="例如: VIP用户, 高级会员"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">
                折扣率 (%) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discount"
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="100"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: Number(e.target.value)
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                100 表示原价（无折扣），50 表示五折，0 表示免费
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">排序权重</Label>
              <Input
                id="sort_order"
                type="number"
                placeholder="0"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sort_order: Number(e.target.value)
                  })
                }
              />
              <p className="text-xs text-muted-foreground">数值越小越靠前</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="分组的说明信息"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 删除确认 Dialog ==================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除分组「{deletingGroup?.display_name}
              」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isDeleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
