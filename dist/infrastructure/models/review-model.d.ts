import { Schema, Document } from 'mongoose';
export interface IReview extends Document {
    userId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ReviewModel: import("mongoose").Model<IReview, {}, {}, {}, Document<unknown, {}, IReview, {}, {}> & IReview & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default ReviewModel;
