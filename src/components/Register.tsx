import * as React from 'react';
import { Link } from 'react-router-dom';
import { withFormik, FieldProps } from 'formik';
import { Container, Form, Input, InputGroup, Button } from 'reactstrap';

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
    <h1>Register</h1>
    <Input
      type="email"
      name="email"
      placeholder="Email"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.email}
      className="my-3"
    />
    {touched.email && errors.email && <div>{errors.email}</div>}
    <Input
      name="name"
      placeholder="Full name"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.name}
      className="my-3"
    />
    {touched.name && errors.name && <div>{errors.name}</div>}
    <Input
      type="password"
      name="password"
      placeholder="Password"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.password}
      className="my-3"
    />
    {touched.password && errors.password && <div>{errors.password}</div>}
    <Input
      type="password"
      name="password2"
      placeholder="Verify password"
      onChange={handleChange}
      onBlur={handleBlur}
      value={values.password2}
      className="my-3"
    />
    {touched.password2 && errors.password2 && <div>{errors.password2}</div>}
    <Button type="submit" disabled={isSubmitting} className="my-3">
      Submit
    </Button>
    <p>
      Already registered? <Link to="/login">Login</Link>
    </p>
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
    if (!values.password) {
      errors.password = 'Required';
    } else if (values.password !== values.password2) {
      errors.password = 'Password mismatch!';
    } else if (values.password.length < 6) {
      errors.password = 'Password is too short!';
    }
    return errors;
  },
  // Submission handler
  handleSubmit: (
    values,
    { props, setSubmitting, setErrors /* setValues, setStatus, and other goodies */ },
  ) => {
    console.log(values);
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
