import { Global, Module } from '@nestjs/common';
import {
  PrismaChatRepositoryProvider,
  PrismaFollowUpRepositoryProvider,
} from './infrastructure/prisma-chat.repository';
import {
  GetMessagesUseCase,
  GetMyConversationUseCase,
  ListConversationsUseCase,
  MarkConversationReadUseCase,
  SendMessageToCoachUseCase,
  SendToMemberUseCase,
  SendMessageUseCase,
} from './application/use-cases/chat.use-cases';
import { ChatController } from './presentation/chat.controller';

@Global()
@Module({
  controllers: [ChatController],
  providers: [
    PrismaChatRepositoryProvider,
    PrismaFollowUpRepositoryProvider,
    ListConversationsUseCase,
    GetMyConversationUseCase,
    GetMessagesUseCase,
    SendMessageUseCase,
    SendToMemberUseCase,
    SendMessageToCoachUseCase,
    MarkConversationReadUseCase,
  ],
  exports: [PrismaChatRepositoryProvider, PrismaFollowUpRepositoryProvider],
})
export class ChatModule {}
