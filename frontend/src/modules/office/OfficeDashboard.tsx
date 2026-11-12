import { Bus, CalendarCheck, FileText, Inbox, Megaphone, Receipt, UserPlus, Wallet } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/ui';
import { fmtDate, inr, todayISO } from '@/utils/format';
import { QuickAction, useStaff } from '@/modules/admin/_shared';
import { EnquiriesPanel, PendingLeavesPanel, RecentPaymentsPanel, useSchoolStats } from '@/modules/admin/DashboardWidgets';

export default function OfficeDashboard() {
  const stats = useSchoolStats();
  const { user, base } = useStaff();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={fmtDate(todayISO(), { weekday: 'long', day: 'numeric', month: 'long' })} title={`Welcome, ${user?.name ?? 'Office'}`}
        subtitle="Front-office desk · collections, enquiries, leave requests and daily operations" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected today" value={inr(stats.todayCollection)} icon={<Receipt className="h-5 w-5" />} tone="gold" hint={`${stats.todayReceipts} receipts issued`} />
        <StatCard label="New enquiries" value={stats.newEnquiries} icon={<Inbox className="h-5 w-5" />} tone="red" hint="Need a call-back" />
        <StatCard label="Leave requests" value={stats.pendingLeaves} icon={<FileText className="h-5 w-5" />} tone="blue" hint="Pending approval" />
        <StatCard label="Attendance" value={`${stats.attPct}%`} icon={<CalendarCheck className="h-5 w-5" />} tone="green" hint={stats.attIsToday ? 'Today' : 'Last recorded day'} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction to={`${base}/fees`} icon={Wallet} label="Collect fee" desc="Cash, cheque or UPI" />
        <QuickAction to={`${base}/students`} icon={UserPlus} label="New admission" desc="Register a student" />
        <QuickAction to={`${base}/communication`} icon={Megaphone} label="Send notice" desc="Announcement or SMS-style alert" />
        <QuickAction to={`${base}/transport`} icon={Bus} label="Track buses" desc="Live fleet monitor" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <RecentPaymentsPanel todayOnly limit={8} />
        <EnquiriesPanel limit={5} />
      </div>
      <PendingLeavesPanel limit={6} />
    </div>
  );
}
