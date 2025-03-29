<?php
/**
 *
 * 文档digg处理ajax文件
 *
 * @version        $Id: digg_ajax.php 2 13:00 2011/11/25 $
 * @package        DedeCMS.Plus
 * @founder        IT柏拉图, https://weibo.com/itprato
 * @author         DedeCMS团队
 * @copyright      Copyright (c) 2004 - 2024, 上海卓卓网络科技有限公司 (DesDev, Inc.)
 * @license        http://help.dedecms.com/usersguide/license.html
 * @link           http://www.dedecms.com
 */
require_once(dirname(__FILE__)."/../include/common.inc.php");

// 输入验证
$action = isset($action) ? trim($action) : '';
$id = empty($id) ? 0 : intval(preg_replace("/[^\d]/",'', $id));
$state = isset($state) ? intval($state) : 0;  // 新增状态参数

if($id < 1) {
    exit(json_encode(['error' => 'Invalid article ID']));
}

// 验证action参数
if($action && !in_array($action, ['good', 'bad'])) {
    exit(json_encode(['error' => 'Invalid action']));
}

// 验证state参数
if(!in_array($state, [-1, 0, 1])) {
    exit(json_encode(['error' => 'Invalid state']));
}

helper('cache');

$maintable = '#@__archives';
$prefix = 'diggCache';
$key = 'aid-'.$id;

// 获取缓存数据
$row = GetCache($prefix, $key);

// 如果缓存无效或需要直接更新
if(!is_array($row) || $cfg_digg_update==0) {
    // 获取文章数据
    $row = $dsql->GetOne("SELECT goodpost,badpost,scores FROM `$maintable` WHERE id='$id'");
    if(!$row) {
        exit(json_encode(['error' => 'Article not found']));
    }
    
    // 直接更新模式
    if($cfg_digg_update == 0) {
        // 根据状态更新数据
        if($state == 1) {  // 点赞
            $row['goodpost']++;
            $dsql->ExecuteNoneQuery("UPDATE `$maintable` SET scores = scores + {$cfg_caicai_add}, goodpost=goodpost+1, lastpost=".time()." WHERE id='$id'");
        } else if($state == -1) {  // 踩
            $row['badpost']++;
            $dsql->ExecuteNoneQuery("UPDATE `$maintable` SET scores = scores - {$cfg_caicai_sub}, badpost=badpost+1, lastpost=".time()." WHERE id='$id'");
        } else if($state == 0) {  // 取消操作
            if($action == 'good') {
                $row['goodpost']--;
                $dsql->ExecuteNoneQuery("UPDATE `$maintable` SET scores = scores - {$cfg_caicai_add}, goodpost=goodpost-1, lastpost=".time()." WHERE id='$id'");
            } else if($action == 'bad') {
                $row['badpost']--;
                $dsql->ExecuteNoneQuery("UPDATE `$maintable` SET scores = scores + {$cfg_caicai_sub}, badpost=badpost-1, lastpost=".time()." WHERE id='$id'");
            }
        }
        DelCache($prefix, $key);
    }
    SetCache($prefix, $key, $row, 0);
} 
// 缓存模式
else {
    if($state == 1) {  // 点赞
        $row['goodpost']++;
        $row['scores'] += $cfg_caicai_sub;
        if($row['goodpost'] % $cfg_digg_update == 0) {
            $add_caicai_sub = $cfg_digg_update * $cfg_caicai_sub;
            $dsql->ExecuteNoneQuery("UPDATE `$maintable` SET scores = scores + {$add_caicai_sub}, goodpost=goodpost+{$cfg_digg_update} WHERE id='$id'");
            DelCache($prefix, $key);
        }
    } else if($state == -1) {  // 踩
        $row['badpost']++;
        $row['scores'] -= $cfg_caicai_sub;
        if($row['badpost'] % $cfg_digg_update == 0) {
            $add_caicai_sub = $cfg_digg_update * $cfg_caicai_sub;
            $dsql->ExecuteNoneQuery("UPDATE `$maintable` SET scores = scores - {$add_caicai_sub}, badpost=badpost+{$cfg_digg_update} WHERE id='$id'");
            DelCache($prefix, $key);
        }
    } else if($state == 0) {  // 取消操作
        if($action == 'good') {
            $row['goodpost']--;
            $row['scores'] -= $cfg_caicai_sub;
        } else if($action == 'bad') {
            $row['badpost']--;
            $row['scores'] += $cfg_caicai_sub;
        }
    }
    SetCache($prefix, $key, $row, 0);
}

// 计算百分比
if($row['goodpost'] + $row['badpost'] == 0) {
    $row['goodper'] = $row['badper'] = 0;
} else {
    $row['goodper'] = number_format($row['goodpost'] / ($row['goodpost'] + $row['badpost']), 3) * 100;
    $row['badper'] = 100 - $row['goodper'];
}

// 格式化数据
$row['goodper'] = trim(sprintf("%4.2f", $row['goodper']));
$row['badper'] = trim(sprintf("%4.2f", $row['badper']));

// 返回数据
AjaxHead();
if($formurl == 'caicai') {
    echo $action == 'good' ? $row['goodpost'] : $row['badpost'];
} else {
    echo json_encode([
        'goodpost' => $row['goodpost'],
        'badpost' => $row['badpost'],
        'goodper' => $row['goodper'],
        'badper' => $row['badper'],
        'userState' => $state  // 返回用户当前状态
    ]);
}
exit();
