export type HotspotOnLoginScriptOptions = {
  validity: string;
  serverUrl: string;
  lockMac?: boolean;
  removeAccount?: boolean;
  broadcastAdmin?: boolean;
  broadcastReseller?: boolean;
};

function boolFlag(value: boolean | undefined, fallback = false) {
  return value ?? fallback ? "1" : "0";
}

export function buildHotspotVoucherOnLoginScript(options: HotspotOnLoginScriptOptions) {
  const serverUrl = options.serverUrl.replace(/\/$/, "");
  const rmcde = [
    boolFlag(options.broadcastAdmin),
    boolFlag(options.removeAccount, true),
    boolFlag(options.lockMac),
    boolFlag(options.broadcastReseller, true),
    "0",
  ].join("") + "||||||||";

  const ut = options.validity || "00:00:00";

  return `:local rmcde ("${rmcde}");` +
    `:local ut ("${ut}");` +
    `:local bcadmin [:pick $rmcde 0];` +
    `:local removeacc [:pick $rmcde 1];` +
    `:local kuncimacnya [:pick $rmcde 2];` +
    `:local bcreseller [:pick $rmcde 3];` +
    `:local date [/system clock get date];` +
    `:if ([:pick $date 4 5] = "-") do={:local arraybln {"01"="jan";"02"="feb";"03"="mar";"04"="apr";"05"="may";"06"="jun";"07"="jul";"08"="aug";"09"="sep";"10"="oct";"11"="nov";"12"="dec"};:local tgl [:pick $date 8 10];:local bulan [:pick $date 5 7];:local tahun [:pick $date 0 4];:local bln ($arraybln->$bulan);:set $date ($bln."/".$tgl."/".$tahun);};` +
    `:local timeq [/system clock get time];` +
    `:local jamskr [/system clock get time];` +
    `:local tglskr [:pick $date 4 6];` +
    `:local blnskr [:pick $date 0 3];` +
    `:local thnskr [:pick $date 7 11];` +
    `:local tglq [:pick $date 4 6];` +
    `:local blnq [:pick $date 0 3];` +
    `:local thnq [:pick $date 7 11];` +
    `:local garing ("/");` +
    `:local td (":");` +
    `:local macadd $"mac-address";` +
    `:local ambiluptime [/ip hotspot user get [find where name="$user"] limit-uptime];` +
    `:local ambilkomen [/ip hotspot user get [find where name="$user"] comment];` +
    `:local ambilvoc [:pick $ambilkomen [:find $ambilkomen "voc :"] [:find $ambilkomen " | tgl :"]];` +
    `:local ambilreseller [:pick $ambilkomen [:find $ambilkomen "ID : "] [:find $ambilkomen " | voc :"]];` +
    `:local jenisvcnya [:pick $ambilvoc 6 80];` +
    `:local namareseller [:pick $ambilreseller 5 80];` +
    `:if ([:len [/system scheduler find name=$user]]=0) do={` +
    `:if ($kuncimacnya=1) do={/ip hotspot user set mac-address=$macadd [find where name=$user]};` +
    `/system scheduler add name="$user" interval=$ut on-event=":local hitung [/system scheduler get [find where name=\\"$user\\"] run-count];:if (\\$hitung < 5) do={/tool fetch http-method=post url=\\"${serverUrl}/api/mikrotik/webhook\\" http-data=\\"idtelegram=$namareseller&status=expired&info=$user|$jenisvcnya|0|$namareseller|0|0|0|0|$rmcde\\" keep-result=no};/ip hotspot active remove [find where user=$user];:if ($removeacc=1) do={/ip hotspot user set [find where name=\\"$user\\"] limit-uptime=\\"00:00:01\\" comment=\\"masuk masa tenggat\\";/sys sch set [find where name=\\"$user\\"] name=\\"tenggat_$user\\" on-event=\\"/ip hotspot user remove [find where name=\\\\\\"$user\\\\\\"];/ip hotspot cookie remove [find user=\\\\\\"$user\\\\\\"];/sys sch remove [find where name=\\\\\\"tenggat_$user\\\\\\"];\\\";} else={:local commentbaru \\"$ambilkomen\\";:local uptimebaru \\"$ambiluptime\\";/ip hotspot user set [find where name=\\"$user\\"] disabled=yes comment=\\"\\$commentbaru\\" limit-uptime=\\"\\$uptimebaru\\";/ip hotspot user reset-counter [find where name=\\"$user\\"];/sys sch remove [find where name=\\"$user\\"];};";` +
    `:delay 2s;` +
    `:local exp [/sys sch get [find where name="$user"] next-run];` +
    `:if ([:pick $exp 10 11] = " ") do={:local arraybln {"01"="jan";"02"="feb";"03"="mar";"04"="apr";"05"="may";"06"="jun";"07"="jul";"08"="aug";"09"="sep";"10"="oct";"11"="nov";"12"="dec"};:local tgl [:pick $exp 8 10];:local bulan [:pick $exp 5 7];:local tahun [:pick $exp 0 4];:local bln ($arraybln->$bulan);:local jam [:pick $exp 11 19];:set $exp ($bln."/".$tgl."/".$tahun." ".$jam);} else={:if ([:pick $exp 2 3] = "-") do={:local arraybln {"01"="jan";"02"="feb";"03"="mar";"04"="apr";"05"="may";"06"="jun";"07"="jul";"08"="aug";"09"="sep";"10"="oct";"11"="nov";"12"="dec"};:local tgl [:pick $exp 3 5];:local bulan [:pick $exp 0 2];:local bln ($arraybln->$bulan);:local jam [:pick $exp 6 14];:set $exp ($bln."/".$tgl." ".$jam);};:if ([:pick $exp 4 5] = "-") do={:local arraybln {"01"="jan";"02"="feb";"03"="mar";"04"="apr";"05"="may";"06"="jun";"07"="jul";"08"="aug";"09"="sep";"10"="oct";"11"="nov";"12"="dec"};:local tgl [:pick $exp 8 10];:local bulan [:pick $exp 5 7];:local tahun [:pick $exp 0 4];:local bln ($arraybln->$bulan);:local jam [:pick $exp 6 14];:set $exp ($bln."/".$tgl."/".$tahun." ".$jam);};};` +
    `:local lexp [:len $exp];` +
    `:local komenusr [/ip hotspot user get [find where name="$user"] comment];` +
    `:if ($lexp = 8) do={:set timeq [:pick $exp 0 8];};` +
    `:if ($lexp = 15) do={:set blnq [:pick $exp 0 3];:set tglq [:pick $exp 4 6];:set timeq [:pick $exp 7 15];};` +
    `:if ($lexp = 20) do={:set blnq [:pick $exp 0 3];:set tglq [:pick $exp 4 6];:set thnq [:pick $exp 7 11];:set timeq [:pick $exp 12 20];};` +
    `/ip hotspot user set [find where name="$user"] comment="start $jamskr - $tglskr-$blnskr-$thnskr end $timeq - $tglq-$blnq-$thnq | $komenusr";` +
    `/sys sch set [find where name="$user"] start-date="$blnq$garing$tglq$garing$thnq" start-time="$timeq" comment="berakhir pada $td $tglq $blnq $thnq pukul $timeq " interval="01:00:00";` +
    `/tool fetch http-method=post url="${serverUrl}/api/mikrotik/webhook" http-data="idtelegram=$namareseller&status=start&info=$user|$jenisvcnya|$macadd|$namareseller|$jamskr|$tglskr-$blnskr-$thnskr|$timeq|$tglq-$blnq-$thnq|$rmcde" keep-result=no;` +
    `};`;
}
