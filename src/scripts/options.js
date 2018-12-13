import ext from "./utils/ext";
import storage from "./utils/storage";
const $ = require('../../node_modules/jquery/dist/jquery.min');
require('../../node_modules/materialize-css/dist/js/materialize.min');

$('#submit-ops').on('click',function (e) {
  e.stopImmediatePropagation();
  e.preventDefault();
  const ops = $('#ops-form').serializeArray();
  console.log('eee',ops);
  storage.set({ ops }, function() {
    M.toast({html: '保存成功，请重新打开chrome插件或者刷新弹出页'})
  });
});

storage.get('ops', function(resp) {
  console.log('resp', resp);
  for(let i of resp.ops){
    $(`#${i.name}`).attr('value',i.value)
  }
});
