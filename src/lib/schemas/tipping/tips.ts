import mongoose from 'mongoose';

const options = {
    timestamps: true,
}



// model Tip {
//     id             String   @id @default(cuid())
//     senderFullName String?  @map("sender_full_name") @db.VarChar(255)
//     senderEmail    String?  @map("sender_email") @db.VarChar(255)
//     senderPhone    String?  @map("sender_phone") @db.VarChar(255)
//     note           String?
//     verified       Boolean  @default(false)
//     userId         String   @map("user_id")

//     trxRef         String   @unique @map("trx_ref")
//     sessionId      String?  @unique @map("session_id")

//     anonymous      Boolean  @default(false)
//     amount         Float

//     created_at     DateTime @default(now()) @db.Timestamp(0)
//     updated_at     DateTime @updatedAt @db.Timestamp(0)

//     currency       Currency @default(ETB)
//     type           TipType  @default(Default)
//     goalId         Int?
//     User           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
//     TipGoal        TipGoal? @relation(fields: [goalId], references: [id], onDelete: Cascade)
  
//     @@index([userId])
//     @@index([goalId])
//   }

// Mongoose schema for database
const TipSchema = new mongoose.Schema({
    // User id of the tipper 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, enum: ['ETB', 'USD'] },
    // To which tip box will this go to 
    tipBoxId: { type: mongoose.Schema.Types.ObjectId, ref: 'TipBox', required: true }, 

    // Sender info 
    senderEmail: { type: String, required: true },
    senderPhone: { type: String, required: true },
    senderFullName: { type: String, default: 'Jami' },

    // Tip State information 
    isAnonymous: { type: Boolean, default: false }, // Tipper wants to stay anonymous 
    note: { type: String, default: '', maxLength: 1080 }, // Tipper's note to the recipient 
    verified: { type: Boolean, default: false }, // Tipper's tip has been verified by the system as valid 

    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null }, // Supported goal with the tip 

    // Payment gateway info
    trxRef: { type: String, required: true }, // Transaction reference 
    sessionId: { type: String, required: true }, // Session id of the tipper 

}, options);


// Create the model
const Tip = mongoose.models.Tip || mongoose.model('Tip', TipSchema);

export { Tip }; 

