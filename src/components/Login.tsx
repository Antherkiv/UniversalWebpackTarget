import * as React from 'react';
import { withFormik, FieldProps } from 'formik';
import { Container, Form, Input, InputGroup, Button } from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.css';

// Our inner form component which receives our form's state and updater methods as props
const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
}: any) => (
  <Form onSubmit={handleSubmit} className="m-3">
    <Input
      type="email"
      name="email"
      placeholder="Email"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.email}
      className="mt-3"
    />
    {touched.email && errors.email && <div>{errors.email}</div>}
    <Input
      type="password"
      name="password"
      placeholder="Password"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.password}
      className="mt-3"
    />
    {touched.password && errors.password && <div>{errors.password}</div>}
    <Button type="submit" disabled={isSubmitting} className="mt-3">
      Submit
    </Button>
  </Form>
);

// Wrap our form with the using withFormik HoC
export default withFormik({
  // Transform outer props into form values
  mapPropsToValues: props => ({ email: '', password: '' }),
  // Add a custom validation function (this can be async too!)
  validate: (values: any, props) => {
    const errors: any = {};
    if (!values.email) {
      errors.email = 'Required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
      errors.email = 'Invalid email address';
    }
    return errors;
  },
  // Submission handler
  handleSubmit: (
    values,
    { props, setSubmitting, setErrors /* setValues, setStatus, and other goodies */ },
  ) => {
    new Promise((resolve: Function) => setTimeout(resolve, 3000)).then(
      user => {
        setSubmitting(false);
        // do whatevs...
        // props.updateUser(user)
      },
      errors => {
        setSubmitting(false);
        // Maybe even transform your API's errors into the same shape as Formik's!
        setErrors(errors);
      },
    );
  },
})(InnerForm);
