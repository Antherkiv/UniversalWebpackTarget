import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect, Dispatch } from 'react-redux';
import { Form, Input, FormFeedback, Button, Alert } from 'reactstrap';
import { Formik, InjectedFormikProps, FormikActions } from 'formik';
import * as yup from 'yup';

import { Actions, RegisterValues } from '../actions/auth';

interface RegisterProps {}

// Our inner form component which receives our form's state and updater methods as props
const RegisterForm: React.SFC<InjectedFormikProps<RegisterProps, RegisterValues>> = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}) => (
  <Form onSubmit={handleSubmit} className="m-3">
    <h1>Register</h1>
    {errors.message && (
      <p>
        <Alert color="danger">{errors.message}</Alert>
      </p>
    )}
    <Input
      name="name"
      placeholder="Name"
      autoComplete="name"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.name}
      invalid={touched.name && errors.name}
      className="my-3"
    />
    <FormFeedback valid={!touched.name || !errors.name}>{errors.name}</FormFeedback>
    <Input
      type="email"
      name="email"
      placeholder="Email"
      autoComplete="email"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.email}
      invalid={touched.email && errors.email}
      className="my-3"
    />
    <FormFeedback valid={!touched.email || !errors.email}>{errors.email}</FormFeedback>
    <Input
      type="password"
      name="password"
      placeholder="Password"
      autoComplete="new-password"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.password}
      invalid={touched.password && errors.password}
      className="my-3"
    />
    <FormFeedback valid={!touched.password || !errors.password}>{errors.password}</FormFeedback>
    <Button type="submit" disabled={isSubmitting} className="my-3">
      Submit
    </Button>
    <p>
      Already registered? <Link to="/login">Login</Link>
    </p>
  </Form>
);

// FORM CONFIGURATION

const initialValues = {
  name: '',
  email: '',
  password: '',
};

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required!')
    .label('Name'),
  email: yup
    .string()
    .required('Email is required!')
    .email('Invalid email address')
    .label('Email'),
  password: yup
    .string()
    .required('Password is required!')
    .min(6, 'Password has to be longer than 6 characters!')
    .label('Password'),
});

// CONTAINER

interface RegisterFormikProps {
  onSubmit(values: RegisterValues, formikActions: FormikActions<RegisterValues>): any;
}

const mapDispatchToProps = (dispatch: Dispatch): RegisterFormikProps => ({
  onSubmit: (values, formikActions) =>
    dispatch(
      Actions.register(values.email, values.password, values.name, formikActions),
    ),
});

const RegisterFormik = ({ onSubmit }: RegisterFormikProps) => (
  <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    validateOnBlur={false}
    validateOnChange={false}
    onSubmit={onSubmit}
    component={RegisterForm}
  />
);

const Register = connect(null, mapDispatchToProps)(RegisterFormik);

export default Register;
