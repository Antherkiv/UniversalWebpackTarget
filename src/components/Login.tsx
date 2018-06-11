import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect, Dispatch } from 'react-redux';
import { Form, Input, FormFeedback, Button, Alert } from 'reactstrap';
import { Formik, InjectedFormikProps, FormikActions } from 'formik';
import * as yup from 'yup';

import { Actions, LoginValues } from '../actions/auth';

interface LoginProps {}

// Our inner form component which receives our form's state and updater methods as props
const LoginForm: React.SFC<InjectedFormikProps<LoginProps, LoginValues>> = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}) => (
  <Form onSubmit={handleSubmit} className="m-3">
    <h1>Login</h1>
    {errors.message && (
      <p>
        <Alert color="danger">{errors.message}</Alert>
      </p>
    )}
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
      autoComplete="current-password"
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
      Need a new account? <Link to="/register">Register</Link>
    </p>
    <p>
      Forgot password? <Link to="/recover">Recover</Link>
    </p>
  </Form>
);

// FORM CONFIGURATION

const initialValues = {
  email: '',
  password: '',
};

const validationSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required!')
    .email('Invalid email address')
    .label('Email'),
  password: yup
    .string()
    .required('Password is required!')
    .label('Password'),
});

// CONTAINER

interface LoginFormikProps {
  onSubmit(values: LoginValues, formikActions: FormikActions<LoginValues>): any;
}

const mapDispatchToProps = (dispatch: Dispatch): LoginFormikProps => ({
  onSubmit: (values, formikActions) =>
    dispatch(
      Actions.login(values.email, values.password, formikActions),
    ),
});

const LoginFormik = ({ onSubmit }: LoginFormikProps) => (
  <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    validateOnBlur={false}
    validateOnChange={false}
    onSubmit={onSubmit}
    component={LoginForm}
  />
);

const Login = connect(null, mapDispatchToProps)(LoginFormik);

export default Login;
