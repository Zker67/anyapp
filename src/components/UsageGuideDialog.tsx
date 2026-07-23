import { BookOpen, ExternalLink, Keyboard, Library, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface UsageGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  ['Ctrl + K', '聚焦并选中搜索框内容'],
  ['/', '未在输入框或弹窗中时聚焦搜索框'],
  ['↑ / ↓', '在当前结果中移动选择'],
  ['Enter', '启动当前选中的健康软件'],
  ['Escape', '关闭弹层；没有弹层时清空搜索'],
]

export function UsageGuideDialog({ open, onOpenChange }: UsageGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookOpen />使用说明</DialogTitle>
          <DialogDescription>从添加第一个软件开始，了解启动、整理、路径修复和本地数据管理。</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5 leading-6">
          <GuideSection icon={<Library />} title="1. 添加与整理软件">
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>点击顶部“添加软件”，手动填写名称并选择本地 <code>.exe</code> 或 <code>.lnk</code>。</li>
              <li>点击“扫描”，选择一个或多个目录；确认候选、调整名称后再一次性保存，取消不会修改正式配置。</li>
              <li>AnyApp 不支持 <code>.bat</code> 或 <code>.cmd</code>，扫描也不会执行发现的软件。</li>
              <li>通过左侧导航查看全部、收藏、最近、路径异常或分类；顶部搜索支持名称、标签、描述、分类和路径。</li>
            </ul>
          </GuideSection>

          <GuideSection icon={<ExternalLink />} title="2. 启动与更多操作">
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>点击软件行的“启动”运行程序，星标按钮用于加入或移出收藏。</li>
              <li>“更多”菜单可在资源管理器中定位、打开网站、创建桌面快捷方式、编辑或删除记录。</li>
              <li>删除只移除 AnyApp 中的记录，不会删除磁盘上的软件；打开网站前会显示完整目标地址。</li>
            </ul>
          </GuideSection>

          <GuideSection icon={<ShieldCheck />} title="3. 路径、设置与数据">
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>路径异常的软件不能直接启动。打开“数据与行为设置”，可按原根目录和新根目录批量重新定位。</li>
              <li>设置中可以选择启动软件后保持、最小化或退出 AnyApp，也可以开启紧凑清单。</li>
              <li>JSON 导入会先显示预览和迁移提示，确认后才替换配置；也可以导出当前配置或恢复最近三份轮换备份。</li>
              <li>便携版数据默认位于 <code>AnyApp.exe</code> 同级的 <code>AnyAppData</code>。移动软件时请将二者一起移动。</li>
            </ul>
          </GuideSection>

          <GuideSection icon={<Keyboard />} title="4. 键盘操作">
            <dl className="grid grid-cols-[minmax(84px,auto)_1fr] gap-x-3 gap-y-2 text-muted-foreground">
              {shortcuts.map(([keys, description]) => (
                <div className="contents" key={keys}>
                  <dt><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{keys}</kbd></dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </GuideSection>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>知道了</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GuideSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground [&_svg]:size-4 [&_svg]:text-primary">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  )
}
