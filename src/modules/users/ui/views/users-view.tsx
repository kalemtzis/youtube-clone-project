import { UserSection } from "../sections/user-section";
import { UserVideoSection } from "../sections/user-video-section";

interface Props {
  userId: string;
}

export const UsersView = ({ userId }: Props) => {
  return (
    <div className="flex flex-col max-w-[1300px] px-4 pt-2.5 mx-auto mb-10 gap-y-6">
      {/* User Info Section */}
      <UserSection userId={userId} />
      
      {/* User Videos Section */}
      <UserVideoSection userId={userId} />
    </div>
  )
}