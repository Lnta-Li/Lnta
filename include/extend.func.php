<?php
/**
 * 自定义函数库
 * 截取字符串并在超过长度时添加省略号
 * @param string $str 需要处理的字符串
 * @param int $length 截取长度
 * @return string 处理后的字符串
 */
function cutStr($str, $length = 30)
{
    if (mb_strlen($str, 'utf-8') > $length) {
        return mb_substr($str, 0, $length, 'utf-8') . '...';
    } else {
        return $str;
    }
}

function litimgurls($imgid=0)
{
    global $lit_imglist,$dsql;
    //获取附加表
    $row = $dsql->GetOne("SELECT c.addtable FROM #@__archives AS a LEFT JOIN #@__channeltype AS c 
                                                            ON a.channel=c.id where a.id='$imgid'");
    $addtable = trim($row['addtable']);
    
    //获取图片附加表imgurls字段内容进行处理
    $row = $dsql->GetOne("Select imgurls From `$addtable` where aid='$imgid'");
    
    //调用inc_channel_unit.php中ChannelUnit类
    $ChannelUnit = new ChannelUnit(2,$imgid);
    
    //调用ChannelUnit类中GetlitImgLinks方法处理缩略图
    $lit_imglist = $ChannelUnit->GetlitImgLinks($row['imgurls']);
    
    //返回结果
    return $lit_imglist;
}

function translate_text($text, $from = 'auto', $to = 'en')
{
    if(empty($text)) {
        return '';
    }

    $api_url = 'http://api.fanyi.baidu.com/api/trans/vip/translate';
    global $translate_api_id, $translate_api_key;
    
    $app_id = $translate_api_id;
    $secret_key = $translate_api_key;

    $salt = rand(10000,99999);
    $sign = md5($app_id . $text . $salt . $secret_key);

    $args = array(
        'q' => $text,
        'appid' => $app_id,
        'salt' => $salt,
        'from' => $from,
        'to' => $to,
        'sign' => $sign
    );

    $url = $api_url . '?' . http_build_query($args);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    
    if(curl_errno($ch)) {
        error_log('Baidu Translate API Error: ' . curl_error($ch));
        curl_close($ch);
        return '';
    }
    
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if(isset($result['error_code'])) {
        error_log('Baidu Translate API Error: ' . json_encode($result));
        return '';
    }
    
    if(isset($result['trans_result'][0]['dst'])) {
        return $result['trans_result'][0]['dst'];
    }
    
    return '';
}

// 自动检测语言并翻译
function auto_translate($text) {
    global $cfg_auto_translate;
    if ($cfg_auto_translate == 'N') {
        return '';
    }

    if(empty($text)) {
        return $text;
    }
    
    // 检测是否包含中文
    if (preg_match("/[\x{4e00}-\x{9fa5}]/u", $text)) {
        $translated = translate_text($text, 'zh', 'en');
        return ($translated !== $text) ? $translated : $text;
    } else {
        $translated = translate_text($text, 'en', 'zh');
        return ($translated !== $text) ? $translated : $text;
    }
}