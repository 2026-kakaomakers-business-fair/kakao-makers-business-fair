const $=selector=>document.querySelector(selector);
const form=$('#proposal');
form.addEventListener('submit',event=>event.preventDefault());
$('#policyToggle').onclick=()=>{const open=$('#policy').hidden;$('#policy').hidden=!open;$('#policyToggle').setAttribute('aria-expanded',String(open));$('#policyToggle').textContent=open?'접기':'내용 보기';};

const filesInput=$('#files');
let selectedFiles=[];
$('#features').addEventListener('input',()=>{$('#charCount').textContent=$('#features').value.length;});
$('#category').addEventListener('change',()=>{
  const other=$('#other');
  const show=$('#category').value==='기타';
  other.classList.toggle('hidden',!show);
  other.required=show;
  if(!show) other.value='';
});
$('#phone').addEventListener('input',()=>{
  const digits=$('#phone').value.replace(/\D/g,'').slice(0,11);
  $('#phone').value=digits.length>7?digits.slice(0,3)+'-'+digits.slice(3,7)+'-'+digits.slice(7):digits.length>3?digits.slice(0,3)+'-'+digits.slice(3):digits;
});
function renderFiles(){
  const list=$('#fileList');
  list.replaceChildren();
  selectedFiles.forEach((file,index)=>{
    const item=document.createElement('li');
    const name=document.createElement('span');
    name.textContent=file.name;
    const remove=document.createElement('button');
    remove.type='button';
    remove.textContent='×';
    remove.setAttribute('aria-label',file.name+' 첨부 취소');
    remove.onclick=()=>{selectedFiles.splice(index,1);renderFiles();};
    item.append(name,remove);
    list.append(item);
  });
}
function addFiles(files){
  const incoming=Array.from(files);
  if(incoming.some(file=>!/\.(pdf|ppt|pptx|jpe?g|png)$/i.test(file.name))){
    $('#fileError').textContent='PDF, PPT, PPTX, JPG, PNG 파일을 선택해 주세요.';
    return;
  }
  if(selectedFiles.length+incoming.length>3){
    $('#fileError').textContent='파일은 최대 3개까지 첨부할 수 있습니다.';
    return;
  }
  selectedFiles.push(...incoming);
  $('#fileError').textContent='';
  renderFiles();
}
$('#filePicker').onclick=()=>filesInput.click();
filesInput.addEventListener('change',()=>{addFiles(filesInput.files);filesInput.value='';});
$('#dropzone').addEventListener('dragover',event=>event.preventDefault());
$('#dropzone').addEventListener('drop',event=>{event.preventDefault();addFiles(event.dataTransfer.files);});
