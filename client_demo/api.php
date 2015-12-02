<?
$controller = $_GET['c'];
$method = $_GET['m'];

$ret = array('c' => $controller,'m'=>$method);

switch ($controller) {
    case 'user':
        switch ($method) {
            case 'verifyTick':
                $ret['r'] = 1;
                $ret['data'] = array();
                echo json_encode($ret);
                break;
            default:
                $ret['r'] = -1;
                $ret['data'] = array('msg'=>'unkonwn method!');
                echo json_encode($ret);
                exit;
                # code...
                break;
        }
        break;

    default:
        $ret['r'] = -2;
        $ret['data'] = array('msg'=>'unkonwn controller!');
        echo json_encode($ret);
        exit;
        break;
}
?>
