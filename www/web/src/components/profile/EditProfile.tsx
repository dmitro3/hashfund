"use client";
import { toast } from "react-toastify";
import { mixed, object, string } from "yup";
import { ErrorMessage, Form, Formik } from "formik";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

import useAuth from "@/composables/useAuth";
import { useSDK } from "@/composables/useSDK";

import Input from "../widgets/Input";
import AvatarInput from "../widgets/AvatarInput";

export default function EditProfile() {
  const {api} = useSDK();
  const { user, setUser } = useAuth();

  const validationSchema = object().shape({
    avatar: mixed().optional(),
    name: string().max(20).min(2).required(),
  });

  const processForm = async (values: Record<string, any>) => {
    const { data } = await api.user
      .update(user!.id, values);
    return setUser(data);
  };

  return (
    <Popover className="flex flex-col space-y-10">
      <PopoverButton className="self-start border border-secondary rounded px-2 py-1 text-secondary outline-none">
        Edit Profile
      </PopoverButton>
      <PopoverPanel className="absolute flex flex-col rounded-xl bg-dark p-4 space-y-8">
        <div>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
        <Formik
          validationSchema={validationSchema}
          initialValues={{
            avatar: user?.avatar as unknown as File,
            name: user?.name,
          }}
          onSubmit={(values, { setSubmitting }) => {
            toast
              .promise(processForm({ ...values }), {
                pending: "Updating profile",
                error: "Failed to update profile",
                success: "Updated profile successful",
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({ isSubmitting }) => (
            <Form
              autoComplete="off"
              className="flex flex-col space-y-8"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col">
                  <AvatarInput name="avatar" />
                  <small className="text-red">
                    <ErrorMessage name="avatar" />
                  </small>
                </div>
                <Input
                  label="Profile name"
                  placeholder="Full name"
                  name="name"
                />
              </div>
              <button
                disabled={isSubmitting}
                type="submit"
                className="btn btn-primary"
              >
                Save Profile
              </button>
            </Form>
          )}
        </Formik>
      </PopoverPanel>
    </Popover>
  );
}
