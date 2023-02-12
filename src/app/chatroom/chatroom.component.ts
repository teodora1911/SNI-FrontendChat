import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Message } from '../models/message.model';
import { LoginService } from '../services/login.service';
import { MessagesService } from '../services/messages.service';

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.css']
})
export class ChatroomComponent implements OnInit{

  public form: FormGroup = new FormGroup({});
  public selected: string = "";

  constructor(private formBuilder: FormBuilder,
              private loginService: LoginService,
              private messagingService: MessagesService){}

  ngOnInit(): void {
      this.form = this.formBuilder.group({
        content: [null, Validators.required]
      });

      this.messagingService.connect();
  }

  public username(): string {
    var username = this.loginService.username();
    if(username != null){
      return username;
    } else return "";
  }

  public selectUser(event: any){
    console.log(event.target.value);
    this.selected = event.target.value;
  }

  public sendMessage(form: any){
    console.log(this.selected);
    if(this.selected != ""){
      this.messagingService.sendToUser(form.value.content, this.selected);
    }
  }

  public messages() : Array<Message> {
    return this.messagingService.messages;
  }

  public logout() {
    this.messagingService.disconnect();
    this.loginService.logout();
  }

  public participants(): Array<string> {
    var otherParticipants = [];
    otherParticipants.push("*");
    for(var i in this.messagingService.participants){
      if(this.messagingService.participants[i] != this.username()){
        otherParticipants.push(this.messagingService.participants[i]);
      }
    }
    return otherParticipants;
  }

}
