const submitBtn = document.getElementById('submitBtn');
const loginForm = document.getElementById('login-form');



loginForm.addEventListener('submit', async function(e){
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try{
        const response = await fetch('http://localhost:8081/customers',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email,password})
        });

        const data = await response.json();
        if(response.ok){
            console.log("success:",data.message);
            sessionStorage.setItem('username',data.username);
            window.location.href='http://localhost:8081/profile'
        }else{
            console.log("Failure:",data.message)
        }

    }catch(error){
        console.error("error:",error)
    }
    
})