import { useState, useEffect } from "react";
import { userStore, authStore } from "@/lib/localStore";
import { useRole } from "@/lib/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, UserPlus, Mail, RefreshCw, Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ROLE_STYLES = {
  admin: "bg-red-100 text-red-800 border-red-200",
  risk_manager: "bg-blue-100 text-blue-800 border-blue-200",
  viewer: "bg-gray-100 text-gray-700 border-gray-200",
};

const ROLE_LABELS = {
  admin: "Admin",
  risk_manager: "Risk Manager",
  viewer: "Viewer",
};

export default function UserManagement() {
  const { isAdmin, loading: roleLoading } = useRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const { toast } = useToast();

  const load = () => {
    userStore.list().then(data => {
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await userStore.invite(inviteEmail.trim(), inviteRole);
    toast({ title: `Invitation sent to ${inviteEmail}` });
    setInviteEmail("");
    setInviting(false);
    load();
  };

  const handleRoleChange = async (userId, newRole) => {
    await userStore.update(userId, { role: newRole });
    toast({ title: "Role updated" });
    load();
  };

  const handleNotificationToggle = async (u) => {
    await userStore.update(u.id, { notification_email: !u.notification_email });
    load();
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    toast({ title: "Review reminders sent (local mode — no emails)" });
    setSendingReminders(false);
  };

  if (roleLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  if (!isAdmin) return (
    <div className="p-8 text-center">
      <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
      <p className="font-medium text-foreground">Admin access required</p>
      <p className="text-sm text-muted-foreground mt-1">Only administrators can manage users.</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Users className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage access roles and notification settings</p>
        </div>
      </div>

      {/* Role guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { role: "Admin", color: "border-red-200 bg-red-50", desc: "Full access — manage users, create/edit/delete risks, view all data" },
          { role: "Risk Manager", color: "border-blue-200 bg-blue-50", desc: "Create and edit risks, view all data, cannot manage users or delete" },
          { role: "Viewer", color: "border-gray-200 bg-gray-50", desc: "Read-only access — can view risks and reports but cannot make changes" },
        ].map(r => (
          <div key={r.role} className={`p-3 rounded-lg border text-sm ${r.color}`}>
            <p className="font-semibold text-foreground">{r.role}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Invite user */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4" /> Invite New User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Input
              className="flex-1 min-w-48"
              type="email"
              placeholder="email@organisation.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="risk_manager">Risk Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting} className="gap-2">
              <Mail className="w-4 h-4" />
              {inviting ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{users.length} Users</CardTitle>
            <Button variant="outline" size="sm" onClick={handleSendReminders} disabled={sendingReminders} className="gap-2">
              <Bell className="w-4 h-4" />
              {sendingReminders ? "Sending..." : "Send Review Reminders Now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                  {(u.full_name || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.full_name || u.email}</p>
                  {u.full_name && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                  {u.department && <p className="text-xs text-muted-foreground">{u.department}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleNotificationToggle(u)}
                    title={u.notification_email !== false ? "Notifications on — click to disable" : "Notifications off — click to enable"}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {u.notification_email !== false
                      ? <Bell className="w-4 h-4 text-primary" />
                      : <BellOff className="w-4 h-4" />
                    }
                  </button>
                  <Select value={u.role || "viewer"} onValueChange={v => handleRoleChange(u.id, v)}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="risk_manager">Risk Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}