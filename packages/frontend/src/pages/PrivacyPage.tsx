import PageContainer from '../components/layout/PageContainer';

export default function PrivacyPage() {
  return (
    <PageContainer>
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4 text-sm text-gray-600 leading-relaxed">
        <h1 className="text-xl font-bold text-gray-800">隐私政策</h1>
        <p className="text-xs text-gray-400">最后更新：2026年5月29日</p>

        <section>
          <h2 className="font-semibold text-gray-700 mb-2">1. 信息收集</h2>
          <p>SAT 应用仅在您的设备本地存储数据（通过 IndexedDB）。我们不会将您的任务数据、照片或任何个人信息上传至远程服务器。</p>
          <p className="mt-1">AI 助手"小云"功能会将您的任务描述发送至 DeepSeek API 进行处理，此过程中不会附带任何个人身份信息。</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-700 mb-2">2. 权限使用</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>相机</strong>：仅用于拍照打卡功能，照片仅保存在您的设备上</li>
            <li><strong>麦克风</strong>：仅用于语音输入功能，不会录制或上传音频</li>
            <li><strong>通知</strong>：用于任务提醒和阶段提醒</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-700 mb-2">3. 数据安全</h2>
          <p>所有数据存储在您的设备本地。我们建议定期使用应用内的"导出数据"功能进行备份。清除应用数据将导致所有本地数据丢失。</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-700 mb-2">4. 第三方服务</h2>
          <p>本应用使用 DeepSeek API 提供 AI 助手功能。使用 AI 功能即表示您同意 DeepSeek 的服务条款和隐私政策。</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-700 mb-2">5. 联系我们</h2>
          <p>如有任何疑问，请通过应用内反馈功能联系开发者。</p>
        </section>
      </div>
    </PageContainer>
  );
}
