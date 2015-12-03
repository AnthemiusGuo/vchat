<?
$uid = $_GET['uid'];
echo json_encode([
        "ret"=>1,
        "data"=>[
            "ticket"=>md5('sss'),
            "uid"=>$uid,
            "rtcServer"=>[
                "host"=>'127.0.0.1',
                "clientPort"=>3000
            ]
        ]
    ]);
?>
