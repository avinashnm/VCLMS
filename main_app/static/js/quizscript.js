window.onload = initall
var saveAnsButton ;




function initall(){
saveAnsButton = document.getElementById('answer')
saveAnsButton.onclick = saveAnswer
}

function saveAnswer(){
    var ans = $("input:radio[name=name]:checked").val()
    alert("Answer is Submitted Click Next")

    var req = new XMLHttpRequest(); 

    var url  = '/saveAnswer?ans='+ans

    req.open("GET",url,true) 
    // array needed
    req.send()

}