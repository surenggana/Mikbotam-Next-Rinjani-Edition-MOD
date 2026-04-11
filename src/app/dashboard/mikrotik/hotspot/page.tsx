import { getHotspotUsers, getHotspotProfiles } from "@/lib/mikrotik/hotspot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Plus, MoreHorizontal, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function HotspotManagementPage() {
  const [users, profiles] = await Promise.all([
    getHotspotUsers().catch(() => []),
    getHotspotProfiles().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Hotspot Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <BookOpen size={18} />
            Tambah Profil
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
            <Plus size={18} />
            Tambah User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* User List */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="text-orange-600" size={20} />
              Daftar User Hotspot (Router)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Uptime Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user[".id"]}>
                    <TableCell className="font-bold text-slate-700">{user.name}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs">{user.password || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
                        {user.profile}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{user["limit-uptime"] || "Unlimited"}</TableCell>
                    <TableCell>
                      <Badge variant={user.disabled === "true" ? "destructive" : "default"} className="text-[10px]">
                        {user.disabled === "true" ? "Disabled" : "Enabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2">
                            {user.disabled === "true" ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <ShieldOff className="h-4 w-4 text-amber-600" />}
                            {user.disabled === "true" ? "Enable User" : "Disable User"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            Hapus User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Profile List */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="text-teal-600" size={20} />
              Hotspot User Profiles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile Name</TableHead>
                  <TableHead>Shared Users</TableHead>
                  <TableHead>Rate Limit (Rx/Tx)</TableHead>
                  <TableHead>Price (Comment)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((prof: any) => (
                  <TableRow key={prof[".id"]}>
                    <TableCell className="font-semibold text-teal-700">{prof.name}</TableCell>
                    <TableCell>{prof["shared-users"] || "1"}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{prof["rate-limit"] || "Unlimited"}</TableCell>
                    <TableCell className="text-xs italic text-slate-400">{prof.comment || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
