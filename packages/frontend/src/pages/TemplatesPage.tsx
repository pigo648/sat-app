import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { db } from '../db/database';
import type { TaskTemplate } from '../types/task';
import { useTaskStore } from '../stores/useTaskStore';
import { useAppStore } from '../stores/useAppStore';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { loadFromTemplate } = useTaskStore();
  const { addToast } = useAppStore();

  const loadTemplates = async () => {
    const all = await db.taskTemplates.toArray();
    setTemplates(all);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleUseTemplate = async (template: TaskTemplate) => {
    await loadFromTemplate(template);
    await db.taskTemplates.update(template.id!, { useCount: (template.useCount ?? 0) + 1 });
    addToast({ type: 'success', message: `已应用模板「${template.name}」` });
    navigate('/');
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定删除此模板吗？')) {
      await db.taskTemplates.delete(id);
      loadTemplates();
      addToast({ type: 'info', message: '模板已删除' });
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">任务模板</h2>
        <Button variant="primary" size="sm" onClick={() => navigate('/templates/new')}>
          + 新建模板
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon="📁"
          message="还没有模板"
          description="保存常用任务配置，一键复用"
          action={{ label: '创建第一个模板', onClick: () => navigate('/templates/new') }}
        />
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{tpl.name}</h3>
                  {tpl.description && (
                    <p className="text-xs text-gray-400 mt-1">{tpl.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{tpl.tasks.length} 个任务</span>
                    <span>{tpl.timeRangeStart}-{tpl.timeRangeEnd}</span>
                    <span>使用 {tpl.useCount ?? 0} 次</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary-600"
                    onClick={() => navigate(`/templates/${tpl.id}/edit`)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500"
                    onClick={() => tpl.id && handleDelete(tpl.id)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => handleUseTemplate(tpl)}>
                使用此模板
              </Button>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
