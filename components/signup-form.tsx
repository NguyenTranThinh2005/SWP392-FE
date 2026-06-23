import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Tạo tài khoản</CardTitle>
          <CardDescription>
            Nhập thông tin bên dưới để tạo tài khoản
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Họ và Tên</FieldLabel>
                <Input id="name" type="text" placeholder="Nguyễn Văn A" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="display-name">Tên hiển thị</FieldLabel>
                <Input id="display-name" type="text" placeholder="John Doe" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="role">Vai trò</FieldLabel>
                <Select id="role" name="role" required defaultValue="">
                  <option value="" disabled>Chọn vai trò...</option>
                  <option value="Mangaka">Mangaka</option>
                  <option value="TantouEditor">Tantou Editor</option>
                  <option value="EditorialBoard">Ban Biên Tập</option>
                  <option value="Assistant">Trợ lý</option>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                    <Input id="password" type="password" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Xác nhận mật khẩu
                    </FieldLabel>
                    <Input id="confirm-password" type="password" required />
                  </Field>
                </Field>
                <FieldDescription>
                  Phải dài ít nhất 8 ký tự.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit">Tạo tài khoản</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">

      </FieldDescription>
    </div>
  )
}
