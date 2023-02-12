export class MessageSegment {
    id: string;
    segmentId: number;
    segmentsNumber: number;
    sender: string;
    receiver: string;
    content: string;
    extension: string;

    constructor(id: string,
                segmentId: number,
                segmentsNumber: number,
                sender: string,
                receiver: string,
                content: string,
                extension: string)
    {
        this.id = id;
        this.segmentId = segmentId;
        this.segmentsNumber = segmentsNumber;
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
        this.extension = extension;
    }
}

// uuid.v4();