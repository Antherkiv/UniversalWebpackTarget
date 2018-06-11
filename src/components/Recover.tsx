import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect, Dispatch } from 'react-redux';
import { Form, Input, FormFeedback, Button, Alert } from 'reactstrap';
import { Formik, InjectedFormikProps, FormikActions } from 'formik';
import * as yup from 'yup';

import { Actions, RecoverValues } from '../actions/auth';

interface RecoverProps {}

// Our inner form component which receives our form's state and updater methods as props
const RecoverForm: React.SFC<InjectedFormikProps<RecoverProps, RecoverValues>> = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}) => (
  <Form onSubmit={handleSubmit} className="m-3">
    <h1>Recover Password</h1>
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
  email: '',
};

const validationSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required!')
    .email('Invalid email address')
    .label('Email'),
});

// CONTAINER

interface RecoverFormikProps {
  onSubmit(values: RecoverValues, formikActions: FormikActions<RecoverValues>): any;
}

const mapDispatchToProps = (dispatch: Dispatch): RecoverFormikProps => ({
  onSubmit: (values, formikActions) =>
    dispatch(
      Actions.recover(values.email, formikActions),
    ),
});

const RecoverFormik = ({ onSubmit }: RecoverFormikProps) => (
  <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    validateOnBlur={false}
    validateOnChange={false}
    onSubmit={onSubmit}
    component={RecoverForm}
  />
);

const Recover = connect(null, mapDispatchToProps)(RecoverFormik);

export default Recover;
