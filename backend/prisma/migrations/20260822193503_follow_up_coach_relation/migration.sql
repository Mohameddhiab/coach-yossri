-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
