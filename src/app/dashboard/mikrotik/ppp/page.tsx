import { getPppSecrets, getPppProfiles } from "@/lib/mikrotik/ppp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserPlus, BookOpen, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function PppManagementPage() {
  const [secrets, profiles] = await Promise.all([
    getPppSecrets().catch(() => []),
    getPppProfiles().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">PPP (PPPoE) Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <BookOpen size={18} />
            Tambah Profil
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <UserPlus size={18} />
            Tambah Secret
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* PPP Secrets */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <ShieldCheck size={20} />
              Daftar PPP Secrets (Pelanggan)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Remote Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secrets.map((secret: any) => (
                  <TableRow key={secret[".id"]}>
                    <TableCell className="font-bold text-slate-700">{secret.name}</TableCell>
                    <TableCell><Badge variant="outline">{secret.service}</Badge></TableCell>
                    <TableCell className="font-medium text-blue-600">{secret.profile}</TableCell>
                    <TableCell className="text-xs font-mono">{secret["remote-address"] || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={secret.disabled === "true" ? "destructive" : "default"}>
                        {secret.disabled === "true" ? "Disabled" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* PPP Profiles */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
              <BookOpen size={20} />
              PPP User Profiles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile Name</TableHead>
                  <TableHead>Local Address</TableHead>
                  <TableHead>Remote Address</TableHead>
                  <TableHead>Rate Limit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((prof: any) => (
                  <TableRow key={prof[".id"]}>
                    <TableCell className="font-semibold">{prof.name}</TableCell>
                    <TableCell className="text-xs font-mono">{prof["local-address"] || "-"}</TableCell>
                    <TableCell className="text-xs font-mono">{prof["remote-address"] || "-"}</TableCell>
                    <TableCell className="text-xs font-bold text-teal-600">{prof["rate-limit"] || "Unlimited"}</TableCell>
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
