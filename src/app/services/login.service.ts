import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
//import { User } from '../models/user.model';
import { Auth } from '../models/auth.model';
// import { Observable, throwError } from 'rxjs';
// import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private key: string = "sigurnost";

  private usernameKey: string = "sigusername";
  private tokenKey: string = "sigtoken";

  constructor(private router: Router,
              private http: HttpClient) { }

  public login(username: string, password: string) {
    var auth = new Auth(username, password);
    this.http.post<any>("https://signaintchat.com:8443/chat/auth/login", auth)
             .subscribe(response => {
              //var storage = JSON.parse(response);
              // console.log(response);
              sessionStorage.setItem(this.usernameKey, response.username);
              sessionStorage.setItem(this.tokenKey, response.token);
              this.router.navigate(['chatroom']);
             },this.errorCallBack);
  }

  errorCallBack(error: any){
    console.log("Error: " + error); // TODO: Delete this
    alert("Something Wrong Happend! Goto Login Page!");
  }

  public signedIn(): boolean {
    return ((sessionStorage.getItem(this.usernameKey) != null) && (sessionStorage.getItem(this.tokenKey) != null));
  }

  public username(): string | null {
    return sessionStorage.getItem(this.usernameKey);
  }

  public logout(){
    sessionStorage.clear();
    this.router.navigate(['']);
  }
}
