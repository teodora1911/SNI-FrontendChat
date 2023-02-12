import { Injectable } from '@angular/core';
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import * as uuid from 'uuid';
import * as steg from 'ts-steganography';
import { MessageSegment } from '../models/message-segment.model';
import { LoginService } from './login.service';
import { Message } from '../models/message.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  //private wsUrl: string = 'https://192.168.1.3:8443/socket';
  private wsUrl: string = 'https://signaintchat.com:8443/socket';
  private stompClient: any;
  private tokenKey: string = "sigtoken";

  public messages: Array<Message> = new Array<Message>();
  public participants: any = [];

  private segmentedMessages = new Map<string, Array<MessageSegment>>();

  constructor(private loginService: LoginService,
              private http: HttpClient) {}

  connect() {
      //console.log("Initialize WebSocket Connection");
      let ws = new SockJS(this.wsUrl);

      this.stompClient = Stomp.over(ws);
      const _this = this;
      _this.stompClient.connect({"Authorization": "Bearer " + sessionStorage.getItem(_this.tokenKey)}, function (frame : any) {
        // subscribe to participants endpoint
        _this.stompClient.subscribe("/chat/participants", function(response: any){
          _this.participansMessageReceived(response);
        });

        _this.stompClient.subscribe("/chatroom/login", function(response: any){
          _this.participantLoginReceived(response);
        });

        _this.stompClient.subscribe("/chatroom/logout", function(response: any){
          _this.participantLogoutReceived(response);
        });

        // subscribe to my chat
        _this.stompClient.subscribe("/user/queue/private", function(response: any){
          _this.onMessageReceived(JSON.parse(response.body));
        });
      }, this.errorCallBack);
  };

  disconnect() {
      if (this.stompClient !== null) {
          this.stompClient.disconnect();
      }
      //console.log("Disconnected");
  }


  errorCallBack(error : any) {
      // console.log("errorCallBack -> " + error)
      // setTimeout(() => {
      //     this.connect();
      // }, 5000);
      alert("Something Wrong Happend! Goto Login Page!");
      
  }

  sendToUser(content: any, receiver: any){
    if(content === ""){
      console.log("Message should not be empty.");
      return;
    }

    var contentSegments: string[] = [];
    var maxLength = content.length;
    var segmentsNumber = Math.floor(Math.random() * maxLength) + 1;

    //console.log("Number of segments: " + segmentsNumber);
    
    let regex: RegExp = new RegExp('.{1,' + segmentsNumber + '}', 'g');
    content.match(regex)?.forEach((segment: any) => {
      contentSegments.push(segment);
    });

    var messageId = uuid.v4();
    var numberOfSegments = contentSegments.length;
    var username = this.loginService.username();
    if(username == null){
      return;
    }

    //console.log("Number of segments: " + numberOfSegments);
  
    this.encodeInImage(messageId, numberOfSegments, username, receiver, contentSegments[0]);
    for(var i = 1; i < numberOfSegments; ++i){
      var segment = new MessageSegment(messageId, i, numberOfSegments, username, receiver, contentSegments[i], "");
      this.stompClient.send("/chat/send/private", {}, JSON.stringify(segment));
    }
  }

  private encodeInImage(messageId: string, segmentsNumber: number, username: string, receiver: string, content: string) {
    this.http.get('/assets/image.jpg', { responseType: 'blob'})
             .subscribe(blob => {
                var reader = new FileReader();
                var binaryString = reader.readAsDataURL(blob);
                reader.onload = async (event: any) => {
                  var encodedContent = await steg.encode(content, event.target.result);
                  // send segment
                  var segment = new MessageSegment(messageId, 0, segmentsNumber, username, receiver, encodedContent, "jpg");
                  this.stompClient.send("/chat/send/private", {}, JSON.stringify(segment));
                };
             });
  }

  async onMessageReceived(message : MessageSegment) {
    if(message.extension !== "") {
      var content = await steg.decode(message.content);
      message.content = content;
    }

    if(this.segmentedMessages.has(message.id)){
      this.segmentedMessages.get(message.id)?.push(message);

      // check if all segments are in array
      var length = this.segmentedMessages.get(message.id)?.length;
      var actual = this.segmentedMessages.get(message.id)![0].segmentsNumber;
      if(length == actual){
        var fullMessage = new Message();
        var content = "";
        fullMessage.sender = this.segmentedMessages.get(message.id)![0].sender;
        this.segmentedMessages.get(message.id)!.sort((a, b) => a.segmentId - b.segmentId);
        for(var i = 0; i < length; ++i){
          content = content + this.segmentedMessages.get(message.id)![i].content;
        }
        //this.segmentedMessages.get(message.id)!.forEach(segment => content.concat(segment.content));
        //console.log("Content: " + content);
        
        fullMessage.content = content;
        this.messages.push(fullMessage);
        this.segmentedMessages.delete(message.id);
      }
    } else {
      this.segmentedMessages.set(message.id, [message]);
    }
  }

  participansMessageReceived(response: any){
    //console.log("Participants received :: " + response);
    this.participants = [];
    var receivedParticipants = JSON.parse(response.body);
    for(var i in receivedParticipants){
      this.participants.push(receivedParticipants[i]);
    }
  }

  participantLoginReceived(response: any){
    //console.log("Participant login :: " + response);
    const index = this.participants.indexOf(response.body);
    if(index < 0){
      this.participants.push(response.body);
    }
  }

  participantLogoutReceived(response: any){
    //console.log("Participant logout :: " + response);
    const index = this.participants.indexOf(response.body);
    if(index >= 0){
      delete this.participants[index];
    }
  }
}
