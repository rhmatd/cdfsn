<?php
declare(strict_types=1);
require_once __DIR__.'/config.php';
$action=$_GET['action']??'';
$input=json_decode(file_get_contents('php://input'),true)?:[];

/* Peran yang diizinkan & daftar prodi per jalur (Jobseeker) */
const ROLES=['Jobseeker','Jobprovider'];
const PRODI_BY_JALUR=[
    'Akademis'=>['Matematika','Pendidikan Anak Usia Dini (PAUD)'],
    'Vocational'=>['Teknologi Rekayasa Sistem Elektronika','Manajemen Pemasaran'],
];
function validProdi(string $jalur,string $prodi): bool {
    return isset(PRODI_BY_JALUR[$jalur]) && in_array($prodi,PRODI_BY_JALUR[$jalur],true);
}
function allProdi(): array { return array_merge(...array_values(PRODI_BY_JALUR)); }

/* ---------- Helper Jobprovider ---------- */
function requireProvider(): int {
    if(empty($_SESSION['user_id'])) jsonResponse(['success'=>false,'message'=>'Belum login.'],401);
    $q=db()->prepare('SELECT role FROM users WHERE id=? LIMIT 1'); $q->execute([(int)$_SESSION['user_id']]);
    if(($q->fetchColumn()?:'')!=='Jobprovider') jsonResponse(['success'=>false,'message'=>'Fitur khusus Jobprovider.'],403);
    return (int)$_SESSION['user_id'];
}

/* ---------- Helper Jobseeker ---------- */
const GRADE_KEYS=['A','A-','AB','B+','B','B-','BC','C+','C','D','E'];
function requireJobseeker(): int {
    if(empty($_SESSION['user_id'])) jsonResponse(['success'=>false,'message'=>'Belum login.'],401);
    $q=db()->prepare('SELECT role FROM users WHERE id=? LIMIT 1'); $q->execute([(int)$_SESSION['user_id']]);
    if(($q->fetchColumn()?:'')!=='Jobseeker') jsonResponse(['success'=>false,'message'=>'Fitur khusus Jobseeker.'],403);
    return (int)$_SESSION['user_id'];
}
function str150($v): string { return trim(mb_substr((string)$v,0,150)); }
/* Panggil Claude (Messages API). $content = array blok konten. Mengembalikan teks atau null. */
function callClaude(array $content,int $maxTokens=800): ?string {
    if(AI_API_KEY===''||!function_exists('curl_init')) return null;
    $ch=curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>90,
        CURLOPT_HTTPHEADER=>['content-type: application/json','x-api-key: '.AI_API_KEY,'anthropic-version: 2023-06-01'],
        CURLOPT_POSTFIELDS=>json_encode(['model'=>AI_MODEL,'max_tokens'=>$maxTokens,'messages'=>[['role'=>'user','content'=>$content]]],JSON_UNESCAPED_UNICODE)]);
    $raw=curl_exec($ch); $code=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE); $err=curl_error($ch); curl_close($ch);
    $res=json_decode((string)$raw,true); $text='';
    foreach(($res['content']??[]) as $blk) if(($blk['type']??'')==='text') $text.=$blk['text'];
    if($code!==200||$text===''){ error_log('AI error '.$code.' '.$err.' '.substr((string)$raw,0,300)); return null; }
    return $text;
}
function jsonFromText(string $t): ?array {
    $a=strpos($t,'{'); $b=strrpos($t,'}');
    if($a===false||$b===false||$b<$a) return null;
    $d=json_decode(substr($t,$a,$b-$a+1),true);
    return is_array($d)?$d:null;
}

try {
    if($action==='register'){
        $name=trim((string)($input['name']??'')); $email=trim((string)($input['email']??''));
        $instansi=trim((string)($input['instansi']??'')); $role=trim((string)($input['role']??'Jobseeker'));
        $jalur=trim((string)($input['jalur']??'')); $prodi=trim((string)($input['prodi']??''));
        if($name===''||$instansi===''||!filter_var($email,FILTER_VALIDATE_EMAIL))
            jsonResponse(['success'=>false,'message'=>'Data registrasi belum lengkap.'],422);
        if(!in_array($role,ROLES,true))
            jsonResponse(['success'=>false,'message'=>'Peran tidak valid.'],422);
        // Jalur & prodi Jobseeker dipilih setelah login (Dashboard); saat registrasi boleh kosong
        if($role==='Jobseeker' && ($jalur!==''||$prodi!=='')){
            if(!validProdi($jalur,$prodi))
                jsonResponse(['success'=>false,'message'=>'Jalur pendidikan/program studi tidak valid.'],422);
        } else { $jalur=null; $prodi=null; }
        $q=db()->prepare('SELECT id FROM users WHERE email=? LIMIT 1'); $q->execute([$email]);
        if($q->fetch()) jsonResponse(['success'=>false,'message'=>'Email sudah terdaftar.'],409);
        $hash=password_hash('CDFS@12345',PASSWORD_DEFAULT);
        $q=db()->prepare('INSERT INTO users(name,email,password_hash,instansi,role,jalur,prodi) VALUES(?,?,?,?,?,?,?)');
        $q->execute([$name,$email,$hash,$instansi,$role,$jalur,$prodi]);
        $_SESSION['user_id']=(int)db()->lastInsertId(); $_SESSION['user_name']=$name;
        jsonResponse(['success'=>true,'message'=>'Registrasi berhasil. Password awal: CDFS@12345',
            'user'=>['name'=>$name,'email'=>$email,'instansi'=>$instansi,'role'=>$role,'jalur'=>$jalur,'prodi'=>$prodi]]);
    }
    if($action==='login'){
        $email=trim((string)($input['email']??'')); $password=(string)($input['password']??'');
        $q=db()->prepare('SELECT id,name,email,password_hash,instansi,role,jalur,prodi FROM users WHERE email=? LIMIT 1');
        $q->execute([$email]); $u=$q->fetch();
        if(!$u||!password_verify($password,$u['password_hash']))
            jsonResponse(['success'=>false,'message'=>'Email atau kata sandi salah.'],401);
        $_SESSION['user_id']=(int)$u['id']; $_SESSION['user_name']=$u['name']; unset($u['password_hash']);
        jsonResponse(['success'=>true,'user'=>$u]);
    }
    if($action==='update_prodi'){
        if(empty($_SESSION['user_id'])) jsonResponse(['success'=>false,'message'=>'Belum login.'],401);
        $jalur=trim((string)($input['jalur']??'')); $prodi=trim((string)($input['prodi']??''));
        if(!validProdi($jalur,$prodi))
            jsonResponse(['success'=>false,'message'=>'Jalur/program studi tidak valid.'],422);
        $q=db()->prepare("UPDATE users SET jalur=?,prodi=? WHERE id=? AND role='Jobseeker'");
        $q->execute([$jalur,$prodi,(int)$_SESSION['user_id']]);
        jsonResponse(['success'=>true,'jalur'=>$jalur,'prodi'=>$prodi]);
    }
    /* ================= JOBPROVIDER ================= */
    if($action==='jp_bootstrap'){
        $pid=requireProvider();
        $q=db()->prepare('SELECT id,nama,prodi FROM kompetensi WHERE provider_id=? ORDER BY id'); $q->execute([$pid]);
        $komp=array_map(fn($r)=>['id'=>(int)$r['id'],'nama'=>$r['nama'],'prodi'=>$r['prodi']],$q->fetchAll());
        $q=db()->prepare('SELECT jobseeker_id FROM shortlist_kandidat WHERE provider_id=?'); $q->execute([$pid]);
        $short=array_map(fn($v)=>(string)$v,$q->fetchAll(PDO::FETCH_COLUMN));
        // Kandidat: Jobseeker yang sudah memilih prodi (email tidak dikirim)
        $cands=db()->query("SELECT id,name,instansi,jalur,prodi FROM users WHERE role='Jobseeker' AND prodi IS NOT NULL ORDER BY name")->fetchAll();
        foreach($cands as &$c) $c['id']=(int)$c['id']; unset($c);
        jsonResponse(['success'=>true,'kompetensi'=>$komp,'shortlist'=>$short,'candidates'=>$cands]);
    }
    if($action==='jp_kompetensi_add'){
        $pid=requireProvider();
        $nama=trim(mb_substr((string)($input['nama']??''),0,100)); $prodi=(string)($input['prodi']??'');
        if($nama===''||!in_array($prodi,allProdi(),true))
            jsonResponse(['success'=>false,'message'=>'Nama kompetensi dan program studi wajib diisi.'],422);
        $q=db()->prepare('SELECT id FROM kompetensi WHERE provider_id=? AND prodi=? AND LOWER(nama)=LOWER(?)'); $q->execute([$pid,$prodi,$nama]);
        if($q->fetch()) jsonResponse(['success'=>false,'message'=>'Kompetensi sudah ada.'],409);
        db()->prepare('INSERT INTO kompetensi(provider_id,nama,prodi) VALUES(?,?,?)')->execute([$pid,$nama,$prodi]);
        jsonResponse(['success'=>true,'kompetensi'=>['id'=>(int)db()->lastInsertId(),'nama'=>$nama,'prodi'=>$prodi]]);
    }
    if($action==='jp_kompetensi_delete'){
        $pid=requireProvider();
        $q=db()->prepare('DELETE FROM kompetensi WHERE id=? AND provider_id=?'); $q->execute([(int)($input['id']??0),$pid]);
        if(!$q->rowCount()) jsonResponse(['success'=>false,'message'=>'Kompetensi tidak ditemukan.'],404);
        jsonResponse(['success'=>true]);
    }
    if($action==='jp_shortlist'){
        $pid=requireProvider(); $js=(int)($input['jobseeker_id']??0);
        $q=db()->prepare("SELECT id FROM users WHERE id=? AND role='Jobseeker'"); $q->execute([$js]);
        if(!$q->fetch()) jsonResponse(['success'=>false,'message'=>'Kandidat tidak ditemukan.'],404);
        if(!empty($input['on'])) db()->prepare('INSERT IGNORE INTO shortlist_kandidat(provider_id,jobseeker_id) VALUES(?,?)')->execute([$pid,$js]);
        else db()->prepare('DELETE FROM shortlist_kandidat WHERE provider_id=? AND jobseeker_id=?')->execute([$pid,$js]);
        jsonResponse(['success'=>true]);
    }
    /* ================= JOBSEEKER: JOB MATCHING ================= */
    if($action==='js_profile'){
        $uid=requireJobseeker();
        $q=db()->prepare('SELECT transkrip,sertifikat FROM jobseeker_profil WHERE user_id=?'); $q->execute([$uid]); $p=$q->fetch()?:[];
        // Lowongan = kebutuhan kompetensi tiap Jobprovider, dikelompokkan per program studi
        $rows=db()->query("SELECT k.provider_id,u.instansi,k.prodi,k.nama FROM kompetensi k JOIN users u ON u.id=k.provider_id AND u.role='Jobprovider' ORDER BY u.instansi,k.prodi,k.id")->fetchAll();
        $low=[];
        foreach($rows as $r){
            $key=$r['provider_id'].'|'.$r['prodi'];
            if(!isset($low[$key])) $low[$key]=['id'=>$key,'perusahaan'=>$r['instansi'],'prodi'=>$r['prodi'],'kompetensi'=>[]];
            $low[$key]['kompetensi'][]=$r['nama'];
        }
        $tr=json_decode($p['transkrip']??'[]',true)?:[];
        $rowsTr=isset($tr['rows'])?$tr['rows']:$tr; $meta=$tr['meta']??new stdClass();
        jsonResponse(['success'=>true,'transkrip'=>$rowsTr,'transkrip_meta'=>$meta,
            'sertifikat'=>json_decode($p['sertifikat']??'[]',true)?:[],'lowongan'=>array_values($low),
            'ai_enabled'=>AI_API_KEY!==''&&function_exists('curl_init')]);
    }
    if($action==='js_profile_save'){
        $uid=requireJobseeker();
        $mk=[]; foreach(array_slice((array)($input['transkrip']??[]),0,100) as $m){
            $nama=str150($m['nama']??''); $sks=(int)($m['sks']??0); $nilai=strtoupper(trim((string)($m['nilai']??'')));
            if($nama!==''&&$sks>=1&&$sks<=8&&in_array($nilai,GRADE_KEYS,true)) $mk[]=['nama'=>$nama,'sks'=>$sks,'nilai'=>$nilai]+(isset($m['na'])&&is_numeric($m['na'])&&$m['na']>=0&&$m['na']<=4?['na'=>(float)$m['na']]:[])+(!empty($m['umum'])?['umum'=>true]:[]);
        }
        $cert=[]; foreach(array_slice((array)($input['sertifikat']??[]),0,30) as $c){
            $nama=str150($c['nama']??''); $jenis=($c['jenis']??'')==='BNSP'?'BNSP':'Non-BNSP';
            if($nama!=='') $cert[]=['nama'=>$nama,'jenis'=>$jenis,'lembaga'=>str150($c['lembaga']??''),
                'file'=>str150($c['file']??''),'sumber'=>str150($c['sumber']??'')];
        }
        $m=(array)($input['transkrip_meta']??[]);
        $meta=['file'=>str150($m['file']??''),'sumber'=>str150($m['sumber']??''),'prodi_dokumen'=>str150($m['prodi_dokumen']??''),
            'ipk_dokumen'=>isset($m['ipk_dokumen'])&&is_numeric($m['ipk_dokumen'])?(float)$m['ipk_dokumen']:null];
        db()->prepare('INSERT INTO jobseeker_profil(user_id,transkrip,sertifikat) VALUES(?,?,?) ON DUPLICATE KEY UPDATE transkrip=VALUES(transkrip),sertifikat=VALUES(sertifikat)')
            ->execute([$uid,json_encode(['rows'=>$mk,'meta'=>$meta],JSON_UNESCAPED_UNICODE),json_encode($cert,JSON_UNESCAPED_UNICODE)]);
        jsonResponse(['success'=>true,'jumlah_mk'=>count($mk),'jumlah_sertifikat'=>count($cert)]);
    }
    if($action==='js_ai_extract'){
        requireJobseeker();
        if(AI_API_KEY==='') jsonResponse(['success'=>false,'message'=>'API key AI belum diisi.'],400);
        $kind=($input['kind']??'')==='sertifikat'?'sertifikat':'transkrip';
        $mt=(string)($input['media_type']??''); $data=(string)($input['data']??'');
        $allowed=['application/pdf','image/jpeg','image/png','image/webp'];
        if(!in_array($mt,$allowed,true)||$data===''||strlen($data)>7_000_000||base64_decode($data,true)===false)
            jsonResponse(['success'=>false,'message'=>'File tidak valid (PDF/JPG/PNG/WEBP, maks. 5 MB).'],422);
        $block=$mt==='application/pdf'
            ?['type'=>'document','source'=>['type'=>'base64','media_type'=>$mt,'data'=>$data]]
            :['type'=>'image','source'=>['type'=>'base64','media_type'=>$mt,'data'=>$data]];
        $prompt=$kind==='transkrip'
            ?"Dokumen ini adalah transkrip / rekap hasil studi mahasiswa. Ekstrak SEMUA mata kuliah. Balas HANYA dengan JSON tanpa penjelasan:\n"
             ."{\"prodi\": \"nama program studi seperti tertulis\", \"ipk\": angka atau null, \"mata_kuliah\": [{\"nama\": \"...\", \"sks\": angka, \"nilai\": \"nilai huruf, mis. A, A-, B+, AB\"}]}\n"
             ."Jangan mengarang; lewati baris yang tidak terbaca."
            :"Dokumen ini adalah sertifikat. Tentukan apakah sertifikat kompetensi BNSP (diterbitkan LSP berlisensi BNSP / mencantumkan BNSP) atau bukan. Balas HANYA dengan JSON:\n"
             ."{\"nama\": \"nama skema / judul kompetensi sertifikat\", \"jenis\": \"BNSP\" atau \"Non-BNSP\", \"lembaga\": \"lembaga penerbit\"}\n"
             ."Jangan mengarang; isi string kosong bila tidak terbaca.";
        $text=callClaude([$block,['type'=>'text','text'=>$prompt]],$kind==='transkrip'?4000:400);
        $d=$text?jsonFromText($text):null;
        if(!$d) jsonResponse(['success'=>false,'message'=>'Dokumen tidak dapat dibaca oleh AI.']);
        jsonResponse(['success'=>true,'data'=>$d]);
    }
    if($action==='js_ai_analisis'){
        requireJobseeker();
        if(AI_API_KEY==='') jsonResponse(['success'=>true,'ai'=>false,'message'=>'API key AI belum diisi.']);
        $data=[
            'prodi'=>str150($input['prodi']??''),'ipk'=>(float)($input['ipk']??0),'total_sks'=>(int)($input['sks']??0),
            'nilai_terbaik'=>array_slice((array)($input['nilai_terbaik']??[]),0,8),
            'sertifikat'=>array_slice((array)($input['sertifikat']??[]),0,30),
            'pekerjaan_cocok_menurut_skor'=>array_slice((array)($input['pekerjaan_cocok']??[]),0,5),
            'skor_per_lowongan_jobprovider'=>array_slice((array)($input['lowongan']??[]),0,5),
        ];
        $prompt="Anda adalah konselor karier untuk mahasiswa/lulusan di Indonesia. Data berikut diekstrak dari 2 dokumen Jobseeker "
            ."(transkrip nilai dan sertifikat BNSP/Non-BNSP), beserta skor yang dihitung sistem C-DFS:\n\n"
            .json_encode($data,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)
            ."\n\nTulis analisis dalam Bahasa Indonesia, maksimal 220 kata, dengan susunan:\n"
            ."1) Satu paragraf: kekuatan utama dari transkrip (sebut mata kuliah bernilai terbaik) dan dari sertifikat; apakah keduanya relevan dengan lowongan yang ada.\n"
            ."2) Satu paragraf: pekerjaan apa yang paling cocok dan lowongan mana yang paling berpeluang, dengan skor apa adanya (jangan mengubah angka).\n"
            ."3) Daftar berpoin (awali dengan \"- \") maksimal 3 langkah konkret untuk meningkatkan peluang.\n"
            ."Jangan mengarang data yang tidak ada. Gunakan **tebal** untuk nama pekerjaan dan perusahaan.";
        $text=callClaude([['type'=>'text','text'=>$prompt]],900);
        if($text===null) jsonResponse(['success'=>true,'ai'=>false,'message'=>'Layanan AI tidak dapat dihubungi.']);
        jsonResponse(['success'=>true,'ai'=>true,'text'=>$text]);
    }
    if($action==='logout'){ $_SESSION=[]; session_destroy(); jsonResponse(['success'=>true]); }
    if($action==='me'){
        if(empty($_SESSION['user_id'])) jsonResponse(['success'=>false,'message'=>'Belum login.'],401);
        $q=db()->prepare('SELECT id,name,email,instansi,role,jalur,prodi FROM users WHERE id=? LIMIT 1');
        $q->execute([(int)$_SESSION['user_id']]); $u=$q->fetch();
        if(!$u) jsonResponse(['success'=>false,'message'=>'User tidak ditemukan.'],404);
        jsonResponse(['success'=>true,'user'=>$u]);
    }
    jsonResponse(['success'=>false,'message'=>'Action API tidak dikenal.'],404);
} catch(Throwable $e) {
    error_log($e->getMessage());
    jsonResponse(['success'=>false,'message'=>'Database/server error. Periksa php/config.php dan MySQL.'],500);
}
